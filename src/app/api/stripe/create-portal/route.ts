import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userEmail } = await request.json();

    if (!userEmail) {
      return NextResponse.json({ error: 'Email do usuário é obrigatório' }, { status: 400 });
    }

    // Buscar usuário e subscription
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { subscription: true },
    });

    if (!user || !user.subscription?.stripeCustomerId) {
      return NextResponse.json({ error: 'Cliente Stripe não encontrado' }, { status: 404 });
    }

    // Criar portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/assinatura`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Erro ao criar portal session:', error);
    return NextResponse.json(
      { error: 'Erro ao criar portal do cliente' },
      { status: 500 }
    );
  }
}
