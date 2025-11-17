import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper para gerar código de indicação único
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CHRONOS-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET - Buscar dados de indicação do usuário
export async function GET(request: NextRequest) {
  try {
    const userEmail = request.headers.get('x-user-email');
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { referral: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Se não tem Referral, criar um
    let referral = user.referral;
    
    if (!referral) {
      let referralCode = generateReferralCode();
      let attempts = 0;
      const maxAttempts = 10;
      
      // Garantir que o código é único (com limite de tentativas)
      let codeExists = await prisma.referral.findUnique({
        where: { referralCode },
      });
      
      while (codeExists && attempts < maxAttempts) {
        referralCode = generateReferralCode();
        codeExists = await prisma.referral.findUnique({
          where: { referralCode },
        });
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        throw new Error('Não foi possível gerar código único');
      }

      referral = await prisma.referral.create({
        data: {
          userId: user.id,
          referralCode,
        },
      });
    }

    // Buscar comissões
    const commissions = await prisma.referralCommission.findMany({
      where: { referralId: referral.id },
      orderBy: { createdAt: 'desc' },
    });

    const response = {
      referralCode: referral.referralCode,
      referredUsers: referral.referredUsers,
      commissionEarned: referral.commissionEarned,
      commissions: commissions.map((c: any) => ({
        id: c.id,
        referredUserEmail: c.referredUserEmail,
        plan: c.plan,
        amountCents: c.amountCents,
        status: c.status,
        createdAt: c.createdAt,
        paidAt: c.paidAt,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Referrals API] Error fetching referral data:', error);
    return NextResponse.json({ error: 'Failed to fetch referral data' }, { status: 500 });
  }
}

