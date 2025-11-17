import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const email = request.headers.get('x-user-email');

    if (!email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é admin
    const user = await prisma.user.findUnique({
      where: { email },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar estatísticas
    const totalUsers = await prisma.user.count();
    
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'TRIAL' },
        ],
      },
    });

    const subscriptions = await prisma.subscription.findMany({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'TRIAL' },
        ],
      },
    });

    // Calcular MRR
    const planPrices: Record<string, number> = {
      'Básico': 2990,
      'Profissional': 5989,
    };

    let monthlyRevenue = 0;
    subscriptions.forEach((sub) => {
      const price = planPrices[sub.plan] || 0;
      if (sub.billingCycle === 'YEARLY') {
        monthlyRevenue += (price * 12 * 0.8) / 12; // Desconto de 20% anual
      } else {
        monthlyRevenue += price;
      }
    });

    // Comissões pendentes
    const pendingCommissionsData = await prisma.referralCommission.findMany({
      where: { status: 'PENDING' },
    });

    const pendingCommissions = pendingCommissionsData.reduce(
      (sum, c) => sum + c.amountCents,
      0
    );

    const totalReferrals = await prisma.referral.count();
    const activeReferrers = await prisma.referral.count({
      where: { referredUsers: { gt: 0 } },
    });

    // Buscar comissões com detalhes
    const commissions = await prisma.referralCommission.findMany({
      where: { status: 'PENDING' },
      include: {
        referral: {
          include: {
            user: {
              select: { email: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Buscar usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        activeSubscriptions,
        monthlyRevenue: Math.round(monthlyRevenue),
        pendingCommissions,
        pendingCount: pendingCommissionsData.length,
        totalReferrals,
        activeReferrers,
      },
      commissions,
      users,
    });
  } catch (error) {
    console.error('Erro ao buscar stats admin:', error);
    return NextResponse.json(
      { error: 'Erro ao processar' },
      { status: 500 }
    );
  }
}
