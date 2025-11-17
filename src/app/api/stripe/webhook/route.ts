import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Assinatura ausente' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Erro ao verificar webhook:', error);
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('🎯 Processing checkout.session.completed');
  console.log('Session metadata:', session.metadata);
  console.log('Session customer:', session.customer);
  console.log('Session customer_email:', session.customer_email);
  
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan;
  const billingCycle = session.metadata?.billingCycle;

  if (!userId || !plan || !billingCycle) {
    console.error('❌ Metadados ausentes no checkout session:', { userId, plan, billingCycle });
    return;
  }
  
  console.log('✅ Metadados encontrados:', { userId, plan, billingCycle });

  const stripeSubscriptionId = session.subscription as string;
  
  console.log('💾 Salvando subscription no banco...');

  // Atualizar subscription no banco
  // Cliente cadastra cartão e ganha 30 dias de trial para testar com calma
  const subscription = await prisma.subscription.upsert({
    where: { userId },
    update: {
      plan,
      billingCycle,
      status: 'TRIAL', // 30 dias de trial após cadastrar cartão
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

  // Processar comissão de indicação se houver
  await processReferralCommission(userId, plan, billingCycle);

  console.log(`✅ Subscription criada para user ${userId}: ${plan} (${billingCycle})`);
}

async function handleSubscriptionUpdated(subscription: any) {
  const userId = subscription.metadata.userId;

  if (!userId) {
    console.error('userId ausente no metadata da subscription');
    return;
  }

  const status = subscription.status === 'active' ? 'ACTIVE' : 
                 subscription.status === 'trialing' ? 'TRIAL' :
                 subscription.status === 'canceled' ? 'CANCELLED' : 'EXPIRED';

  await prisma.subscription.update({
    where: { userId },
    data: {
      status,
      stripeCurrentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
      endDate: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
    },
  });

  console.log(`Subscription atualizada para user ${userId}: ${status}`);
}

async function handleSubscriptionDeleted(subscription: any) {
  const userId = subscription.metadata.userId;

  if (!userId) {
    console.error('userId ausente no metadata da subscription');
    return;
  }

  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      endDate: new Date(subscription.current_period_end * 1000),
    },
  });

  console.log(`Subscription cancelada para user ${userId}`);
}

async function handlePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.userId;

  if (!userId) return;

  // Marcar como EXPIRED se pagamento falhou
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'EXPIRED',
    },
  });

  console.log(`Pagamento falhou para user ${userId}`);
}

async function handlePaymentSucceeded(invoice: any) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.userId;

  if (!userId) return;

  // Atualizar status para ACTIVE após pagamento bem-sucedido
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'ACTIVE',
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  console.log(`✅ Pagamento recebido para user ${userId}`);

  // Verificar se é o 2º pagamento de plano MENSAL para criar segunda comissão
  await processSecondMonthlyCommission(userId, subscription);
}

// Processar segunda comissão (50% do 2º mês) para planos mensais
async function processSecondMonthlyCommission(userId: string, subscription: any) {
  try {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, referredBy: true },
    });

    if (!user || !user.referredBy) return;

    // Buscar referral
    const referral = await prisma.referral.findUnique({
      where: { referralCode: user.referredBy },
    });

    if (!referral) return;

    // Verificar se já criou a segunda comissão
    const existingSecondCommission = await prisma.referralCommission.findFirst({
      where: {
        referralId: referral.id,
        referredUserId: userId,
        plan: { contains: '2ª parcela' },
      },
    });

    if (existingSecondCommission) {
      // Já criou a segunda comissão
      return;
    }

    // Verificar quantas faturas foram pagas (invoice count)
    const invoices = await stripe.invoices.list({
      subscription: subscription.id,
      status: 'paid',
      limit: 100,
    });

    const paidInvoicesCount = invoices.data.length;

    // Se é o 2º pagamento ou mais, criar segunda comissão (só uma vez)
    if (paidInvoicesCount >= 2) {
      const plan = subscription.metadata.plan;
      const billingCycle = subscription.metadata.billingCycle;

      // Só para planos mensais
      if (billingCycle !== 'MONTHLY') return;

      const planPrices: Record<string, number> = {
        'Básico': 2990,
        'Profissional': 5989,
      };

      const planPrice = planPrices[plan] || 0;
      if (planPrice === 0) return;

      const secondCommission = Math.floor(planPrice * 0.5); // 50%

      await prisma.referralCommission.create({
        data: {
          referralId: referral.id,
          referredUserId: userId,
          referredUserEmail: user.email,
          plan: `${plan} - Mensal (2ª parcela)`,
          amountCents: secondCommission,
          status: 'PENDING',
        },
      });

      console.log(`💰 Segunda comissão mensal criada: ${secondCommission / 100} (50% do 2º mês)`);
    }
  } catch (error) {
    console.error('Erro ao processar segunda comissão:', error);
  }
}

// Processar comissão de indicação
async function processReferralCommission(userId: string, plan: string, billingCycle: string) {
  try {
    // Buscar usuário para ver se foi indicado por alguém
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, referredBy: true },
    });

    if (!user || !user.referredBy) {
      // Não foi indicado por ninguém
      return;
    }

    // Buscar o Referral do indicador pelo código
    const referral = await prisma.referral.findUnique({
      where: { referralCode: user.referredBy },
    });

    if (!referral) {
      console.error(`Código de indicação não encontrado: ${user.referredBy}`);
      return;
    }

    // Valores dos planos em centavos
    const planPrices: Record<string, number> = {
      'Básico': 2990, // R$ 29,90
      'Profissional': 5989, // R$ 59,89
    };

    const planPrice = planPrices[plan] || 0;

    if (planPrice === 0) {
      // Não há comissão para este plano (ex: Empresarial)
      return;
    }

    // NOVA LÓGICA DE COMISSÃO:
    // MENSAL: 50% no 1º pagamento, 50% no 2º pagamento
    // ANUAL: 10% do valor total no 1º pagamento
    
    if (billingCycle === 'MONTHLY') {
      // Plano Mensal: 50% agora (será pago após 1º mês real)
      const firstCommission = Math.floor(planPrice * 0.5); // 50%
      
      await prisma.referralCommission.create({
        data: {
          referralId: referral.id,
          referredUserId: userId,
          referredUserEmail: user.email,
          plan: `${plan} - Mensal (1ª parcela)`,
          amountCents: firstCommission,
          status: 'PENDING', // Será pago após o 1º pagamento real (pós-trial)
        },
      });

      // Segunda comissão será criada quando houver o 2º pagamento (via invoice.payment_succeeded)
      
      console.log(`💰 Comissão mensal criada: ${firstCommission / 100} (50% do 1º mês)`);
      
    } else if (billingCycle === 'YEARLY') {
      // Plano Anual: 10% do valor total
      const yearlyPrice = planPrice * 12 * 0.8; // Preço anual (20% de desconto)
      const commission = Math.floor(yearlyPrice * 0.1); // 10%
      
      await prisma.referralCommission.create({
        data: {
          referralId: referral.id,
          referredUserId: userId,
          referredUserEmail: user.email,
          plan: `${plan} - Anual`,
          amountCents: commission,
          status: 'PENDING', // Será pago após o 1º pagamento real
        },
      });
      
      console.log(`💰 Comissão anual criada: ${commission / 100} (10% do valor anual)`);
    }

    // Atualizar contadores do Referral
    // Nota: commissionEarned será atualizado quando as comissões forem pagas
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        referredUsers: { increment: 1 },
      },
    });

    console.log(`✅ Comissão de indicação processada para referral ${referral.id}`);
  } catch (error) {
    console.error('Erro ao processar comissão de indicação:', error);
  }
}
