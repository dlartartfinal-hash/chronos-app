
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Sale } from "@/context/sales-context"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const formatPaymentMethod = (payment: Sale['payment']) => {
  if (payment.method === 'Crédito' && payment.installments) {
    if (payment.installments > 1) {
      return `${payment.method} (${payment.installments}x)`;
    }
  }
  return payment.method;
};
