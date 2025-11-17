import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID é obrigatório' }, { status: 400 });
    }

    console.log('🔍 Verificando sessão:', sessionId);

    // Buscar sessão no Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    console.log('✅ Sessão encontrada:', {
      id: session.id,
      customer: session.customer,
      subscription: session.subscription,
      metadata: session.metadata,
    });

    if (!session.metadata?.userId) {
      console.error('❌ userId não encontrado nos metadados');
      return NextResponse.json({ error: 'Metadados incompletos' }, { status: 400 });
    }

    const { userId, plan, billingCycle } = session.metadata;
    const stripeSubscriptionId = session.subscription as string;

    if (!stripeSubscriptionId) {
      console.error('❌ Subscription ID não encontrado');
      return NextResponse.json({ error: 'Subscription não encontrada' }, { status: 400 });
    }

    console.log('💾 Criando/atualizando subscription no banco...');

    // Criar ou atualizar subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        billingCycle,
        status: 'TRIAL',
        stripeSubscriptionId,
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
      create: {
        userId,
        plan,
        billingCycle,
        status: 'TRIAL',
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId,
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
    });

    console.log('✅ Subscription salva:', subscription);

    // Buscar subscription completa para retornar
    const userSubscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      subscription: userSubscription,
    });
  } catch (error) {
    console.error('❌ Erro ao verificar sessão:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar sessão' },
      { status: 500 }
    );
  }
}
