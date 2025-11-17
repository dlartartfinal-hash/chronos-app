
import { CreditCard, Wallet, Landmark, User } from 'lucide-react';
import React from 'react';

export type PaymentMethod = {
  value: 'Crédito' | 'Débito' | 'Dinheiro' | 'Pix' | 'Fiado';
  label: string;
  icon: React.ElementType;
  rate?: number; // Taxa em porcentagem
};

export const paymentMethods: PaymentMethod[] = [
  { value: 'Crédito', label: 'Cartão de Crédito', icon: CreditCard },
  { value: 'Débito', label: 'Cartão de Débito', icon: CreditCard },
  { value: 'Dinheiro', label: 'Dinheiro', icon: Wallet },
  { value: 'Pix', label: 'PIX', icon: Landmark },
  { value: 'Fiado', label: 'Fiado', icon: User },
];
