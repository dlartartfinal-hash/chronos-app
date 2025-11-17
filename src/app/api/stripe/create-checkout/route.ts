import { NextRequest, NextResponse } from 'next/server';
import { stripe, getStripePriceId } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { plan, billingCycle, userEmail } = await request.json();

    if (!userEmail) {
      return NextResponse.json({ error: 'Email do usuário é obrigatório' }, { status: 400 });
    }

    if (plan === 'Empresarial') {
      return NextResponse.json({ error: 'Plano Empresarial requer contato direto' }, { status: 400 });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const priceId = getStripePriceId(plan, billingCycle);
    if (!priceId) {
      return NextResponse.json({ 
        error: 'Plano não configurado. As variáveis de ambiente do Stripe não estão definidas corretamente no Vercel.',
        details: `Plano: ${plan}, Ciclo: ${billingCycle}` 
      }, { status: 400 });
    }

    // Criar ou recuperar Stripe Customer
    let stripeCustomerId = user.subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Atualizar banco com stripeCustomerId
      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: { stripeCustomerId },
        create: {
          userId: user.id,
          stripeCustomerId,
          plan: 'Free',
          billingCycle: 'MONTHLY',
          status: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        },
      });
    }

    // Criar Checkout Session
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/assinatura`;
    
    console.log('Creating checkout session with URLs:', { successUrl, cancelUrl });
    
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 30, // 30 dias de trial
        metadata: {
          userId: user.id,
          plan,
          billingCycle,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        plan,
        billingCycle,
      },
    });

    if (!session.url) {
      console.error('Stripe não retornou URL de checkout:', session);
      return NextResponse.json(
        { error: 'Não foi possível gerar URL de checkout. Verifique suas chaves do Stripe.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Erro ao criar checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Erro ao criar sessão de checkout', details: errorMessage },
      { status: 500 }
    );
  }
}
