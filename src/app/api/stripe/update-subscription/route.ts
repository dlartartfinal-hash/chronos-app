import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getStripePriceId } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { plan, billingCycle, userEmail } = await request.json();

    if (!plan || !billingCycle || !userEmail) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Buscar usuário e assinatura atual
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { subscription: true },
    });

    if (!user || !user.subscription) {
      return NextResponse.json(
        { error: 'Usuário ou assinatura não encontrada' },
        { status: 404 }
      );
    }

    const subscription = user.subscription;

    // Verificar se tem stripeSubscriptionId
    if (!subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Assinatura sem ID do Stripe' },
        { status: 400 }
      );
    }

    // Buscar o novo Price ID
    const newPriceId = getStripePriceId(plan, billingCycle);

    if (!newPriceId) {
      return NextResponse.json(
        { error: 'Price ID não encontrado para este plano' },
        { status: 400 }
      );
    }

    // Buscar a assinatura no Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    // Atualizar a assinatura no Stripe
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'always_invoice', // Cobra/credita a diferença imediatamente
      }
    );

    // Atualizar no banco de dados
    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        plan,
        billingCycle,
        stripePriceId: newPriceId,
        status: 'ACTIVE', // Remove o TRIAL se ainda estava em trial
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Plano atualizado com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao atualizar assinatura:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar assinatura' },
      { status: 500 }
    );
  }
}
