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
    monthly: process.env.STRIPE_PRICE_BASICO_MONTHLY || 'price_basico_monthly_id',
    yearly: process.env.STRIPE_PRICE_BASICO_YEARLY || 'price_basico_yearly_id',
  },
  Profissional: {
    monthly: process.env.STRIPE_PRICE_PROFISSIONAL_MONTHLY || 'price_profissional_monthly_id',
    yearly: process.env.STRIPE_PRICE_PROFISSIONAL_YEARLY || 'price_profissional_yearly_id',
  },
};

export function getStripePriceId(plan: string, billingCycle: string): string | null {
  if (plan === 'Empresarial') return null; // Plano sob consulta
  
  const cycle = billingCycle === 'YEARLY' ? 'yearly' : 'monthly';
  
  if (plan === 'Básico') {
    return STRIPE_PLANS.Básico[cycle];
  }
  
  if (plan === 'Profissional') {
    return STRIPE_PLANS.Profissional[cycle];
  }
  
  return null;
}
