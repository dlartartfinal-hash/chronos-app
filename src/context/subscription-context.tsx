
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useUser } from './user-context';
import { apiRequest } from '@/lib/api';

// --- Types and Data ---
export type Plan = {
  name: string;
  monthlyPrice: number | null;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
  maxCollaborators: number;
  maxProducts: number;
};

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export type Subscription = {
  id: string;
  userId: string;
  plan: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  status: SubscriptionStatus;
  startDate: string;
  endDate: string | null;
  trialEndsAt: string | null;
  cancelledAt: string | null;
};

const plans: Plan[] = [
    {
      name: 'Básico',
      monthlyPrice: 29.90,
      description: 'Ideal para negócios que estão começando e precisam do essencial.',
      features: [
        'Até 2 colaboradores',
        'Até 2.000 produtos cadastrados',
        'Relatórios de vendas básicos',
        'Suporte via e-mail',
      ],
      cta: 'Assinar Básico',
      popular: false,
      maxCollaborators: 2,
      maxProducts: 2000,
    },
    {
      name: 'Profissional',
      monthlyPrice: 59.89,
      description: 'Perfeito para empresas em crescimento com maiores demandas.',
      features: [
        'Até 10 colaboradores',
        'Até 20.000 produtos cadastrados',
        'Fotos nos produtos',
        'Relatórios avançados e detalhados',
        'Suporte prioritário via chat',
      ],
      cta: 'Assinar Profissional',
      popular: true,
      maxCollaborators: 10,
      maxProducts: 20000,
    },
    {
      name: 'Empresarial',
      monthlyPrice: null,
      description: 'Uma solução sob medida para as necessidades específicas da sua empresa.',
      features: [
        'Colaboradores ilimitados',
        'Produtos ilimitados',
        'Integrações com outros sistemas (ERP, e-commerce)',
        'Gerente de conta dedicado',
        'Desenvolvimento de funcionalidades exclusivas',
      ],
      cta: 'Entrar em Contato',
      popular: false,
      maxCollaborators: Infinity,
      maxProducts: Infinity,
    },
];

type BillingCycle = 'MONTHLY' | 'YEARLY';

interface SubscriptionContextType {
  plans: Plan[];
  subscription: Subscription | null;
  selectedPlan: Plan;
  billingCycle: BillingCycle;
  isLoading: boolean;
  setSelectedPlan: (planName: string) => Promise<void>;
  setBillingCycle: (cycle: BillingCycle) => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [selectedPlan, setSelectedPlanState] = useState<Plan>(plans[0]); // Default: Básico
  const [billingCycle, setBillingCycleState] = useState<BillingCycle>('MONTHLY');
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await apiRequest<Subscription>('subscriptions', 'GET');
      setSubscription(data);
      
      // Update selected plan based on subscription
      const plan = plans.find(p => p.name === data.plan) || plans[0];
      setSelectedPlanState(plan);
      setBillingCycleState(data.billingCycle);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      // Default to Básico plan if error
      setSubscription(null);
      setSelectedPlanState(plans[0]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const setSelectedPlan = useCallback(async (planName: string) => {
    if (!user) return;
    
    const newPlan = plans.find(p => p.name === planName);
    if (!newPlan) return;

    try {
      const data = await apiRequest<Subscription>('subscriptions', 'PUT', {
        plan: planName,
      });
      
      setSubscription(data);
      setSelectedPlanState(newPlan);
    } catch (error) {
      console.error('Failed to update plan:', error);
      throw error;
    }
  }, [user]);
  
  const setBillingCycle = useCallback(async (cycle: BillingCycle) => {
    if (!user) return;

    try {
      const data = await apiRequest<Subscription>('subscriptions', 'PUT', {
        billingCycle: cycle,
      });
      
      setSubscription(data);
      setBillingCycleState(cycle);
    } catch (error) {
      console.error('Failed to update billing cycle:', error);
      throw error;
    }
  }, [user]);

  const value = { 
    plans, 
    subscription,
    selectedPlan, 
    setSelectedPlan, 
    billingCycle, 
    setBillingCycle,
    isLoading,
    refreshSubscription: fetchSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
