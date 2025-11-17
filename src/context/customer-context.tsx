
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import * as z from 'zod';
import { useUser } from './user-context';
import { apiRequest } from '@/lib/api';

// --- Schemas and Types ---
export const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  phone: z.string().min(10, { message: 'Por favor, insira um telefone válido.' }),
  status: z.enum(['Ativo', 'Inativo']).default('Ativo'),
  avatarId: z.string({ required_error: 'Por favor, selecione um avatar.' }),
  createdAt: z.string().optional(), // Data de criação do cliente
});

export type Customer = z.infer<typeof customerSchema>;

// --- Initial Data ---
const defaultCustomer: Customer = {
    id: 'cust-0',
    name: 'Cliente Avulso',
    email: 'consumidor@final.com',
    phone: '(00) 00000-0000',
    status: 'Ativo',
    avatarId: 'user-generic-3',
};


interface CustomerContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCustomers()
    } else {
      setCustomers([])
      setIsInitialized(false)
    }
  }, [user]);

  const fetchCustomers = async () => {
    try {
      const data = await apiRequest<Customer[]>('customers')
      setCustomers([defaultCustomer, ...data])
      setIsInitialized(true)
    } catch (error) {
      console.error('Error fetching customers:', error)
      setCustomers([defaultCustomer])
      setIsInitialized(true)
    }
  }

  const addCustomer = useCallback(async (customer: Omit<Customer, 'id'>) => {
    try {
      const newCustomer = await apiRequest<Customer>('customers', {
        method: 'POST',
        body: JSON.stringify(customer),
      })
      setCustomers(prev => [...prev, newCustomer])
    } catch (error) {
      console.error('Error adding customer:', error)
      throw error
    }
  }, [])

  const updateCustomer = useCallback(async (customer: Customer) => {
    try {
      const updated = await apiRequest<Customer>('customers', {
        method: 'PUT',
        body: JSON.stringify(customer),
      })
      setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c))
    } catch (error) {
      console.error('Error updating customer:', error)
      throw error
    }
  }, [])

  const deleteCustomer = useCallback(async (customerId: string) => {
    try {
      await apiRequest('customers?id=' + customerId, {
        method: 'DELETE',
      })
      setCustomers(prev => prev.filter(c => c.id !== customerId))
    } catch (error) {
      console.error('Error deleting customer:', error)
      throw error
    }
  }, [])

  const value = { customers, addCustomer, updateCustomer, deleteCustomer };

  if (!isInitialized && user) {
    return null; // or a loading skeleton
  }

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}
