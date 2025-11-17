import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const email = request.headers.get('x-user-email');
    const { commissionId } = await request.json();

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

    if (!commissionId) {
      return NextResponse.json({ error: 'ID da comissão obrigatório' }, { status: 400 });
    }

    // Atualizar comissão para PAID
    const commission = await prisma.referralCommission.update({
      where: { id: commissionId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Atualizar total ganho do referral
    await prisma.referral.update({
      where: { id: commission.referralId },
      data: {
        commissionEarned: { increment: commission.amountCents },
      },
    });

    console.log(`✅ Comissão aprovada: ${commission.amountCents / 100} para ${commission.referredUserEmail}`);

    return NextResponse.json({
      success: true,
      message: 'Comissão aprovada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao aprovar comissão:', error);
    return NextResponse.json(
      { error: 'Erro ao processar' },
      { status: 500 }
    );
  }
}
