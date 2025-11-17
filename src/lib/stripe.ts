import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY não está definida no .env.local');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

// Preços dos planos no Stripe (você precisará criar esses produtos no dashboard do Stripe)
export const STRIPE_PLANS = {
  Básico: {
    monthly: process.env.STRIPE_PRICE_BASICO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_BASICO_YEARLY,
  },
  Profissional: {
    monthly: process.env.STRIPE_PRICE_PROFISSIONAL_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PROFISSIONAL_YEARLY,
  },
};

export function getStripePriceId(plan: string, billingCycle: string): string | null {
  if (plan === 'Empresarial') return null; // Plano sob consulta
  
  const cycle = billingCycle === 'YEARLY' ? 'yearly' : 'monthly';
  
  if (plan === 'Básico') {
    const priceId = STRIPE_PLANS.Básico[cycle];
    if (!priceId || priceId.startsWith('price_basico')) {
      console.error(`Price ID não configurado para Básico ${cycle}`);
      return null;
    }
    return priceId;
  }
  
  if (plan === 'Profissional') {
    const priceId = STRIPE_PLANS.Profissional[cycle];
    if (!priceId || priceId.startsWith('price_profissional')) {
      console.error(`Price ID não configurado para Profissional ${cycle}`);
      return null;
    }
    return priceId;
  }
  
  return null;
}
