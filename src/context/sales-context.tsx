

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useInventory } from './inventory-context';
import { useUser } from './user-context';
import { apiRequest } from '@/lib/api';

// --- Types ---
export type CartItem = { 
  id: string, 
  name: string,
  price: number, 
  originalPrice: number,
  quantity: number,
  imageUrl: string,
  promotionId?: string,
};

export type Sale = {
  id: string;
  date: string; // ISO String
  client: string;
  vendedor: string;
  status: 'Concluída' | 'Pendente' | 'Cancelada';
  payment: {
    method: string;
    installments?: number;
  };
  total: number;
  items: CartItem[];
  subtotal: number;
  fees: number;
};

// --- Helper Functions ---
export const formatPaymentMethod = (payment: Sale['payment']) => {
  if (payment.method === 'Crédito' && payment.installments) {
    if (payment.installments > 1) {
      return `${payment.method} (${payment.installments}x)`;
    }
  }
  return payment.method;
};

// --- Context ---
interface SalesContextType {
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
  updateSaleStatus: (saleId: string, status: Sale['status']) => Promise<void>;
  refreshSales: () => Promise<void>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export function SalesProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { deductStock, products } = useInventory();

  const refreshSales = useCallback(async () => {
    if (!user) return;
    
    try {
      const data = await apiRequest<any[]>('sales');
      
      // Transform API data to match Sale type
      const transformedSales: Sale[] = data.map((sale) => ({
        id: sale.id,
        date: sale.createdAt,
        client: sale.customer?.name || 'Cliente não identificado',
        vendedor: sale.vendedor,
        status: sale.status as Sale['status'],
        payment: {
          method: sale.paymentMethod,
          installments: sale.installments || undefined,
        },
        total: sale.totalCents / 100,
        subtotal: sale.subtotalCents / 100,
        fees: sale.feesCents / 100,
        items: sale.items.map((item: any) => ({
          id: item.productId || item.serviceId || item.id,
          name: item.name,
          price: item.priceCents / 100,
          originalPrice: item.originalPriceCents / 100,
          quantity: item.quantity,
          imageUrl: item.imageUrl || '',
          promotionId: item.promotionId || undefined,
        })),
      }));
      
      setSales(transformedSales);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setSales([]);
      setIsInitialized(true);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshSales();
    } else {
      setSales([]);
      setIsInitialized(false);
    }
  }, [user, refreshSales]);

  const addSale = useCallback(async (sale: Omit<Sale, 'id'>) => {
    if (!user) return;

    try {
      // Find customer ID
      const customers = await apiRequest<any[]>('customers');
      const customer = customers.find(c => c.name === sale.client);

      await apiRequest('sales', {
        method: 'POST',
        body: JSON.stringify({
          customerId: customer?.id || null,
          vendedor: sale.vendedor,
          status: sale.status,
          paymentMethod: sale.payment.method,
          installments: sale.payment.installments || null,
          totalCents: Math.round(sale.total * 100),
          subtotalCents: Math.round(sale.subtotal * 100),
          feesCents: Math.round(sale.fees * 100),
          items: sale.items.map(item => ({
            productId: item.productId || null,
            productVariationId: item.variationId || null,
            serviceId: item.serviceId || null,
            name: item.name,
            quantity: item.quantity,
            priceCents: Math.round(item.price * 100),
            originalPriceCents: Math.round(item.originalPrice * 100),
            imageUrl: item.imageUrl,
            promotionId: item.promotionId || null,
          })),
        }),
      });

      await refreshSales();

      // Deduct stock for products in the sale
      const itemsToDeduct = sale.items.filter(item => {
        return products.some(p => 
          p.hasVariations 
            ? p.variations?.some(v => v.sku === item.id) 
            : p.sku === item.id
        );
      });

      if (itemsToDeduct.length > 0) {
        deductStock(itemsToDeduct);
      }
    } catch (error) {
      console.error('Error adding sale:', error);
      throw error;
    }
  }, [user, refreshSales, deductStock, products]);

  const updateSaleStatus = useCallback(async (saleId: string, status: Sale['status']) => {
    if (!user) return;

    try {
      await apiRequest('sales', {
        method: 'PUT',
        body: JSON.stringify({ id: saleId, status }),
      });

      await refreshSales();
    } catch (error) {
      console.error('Error updating sale status:', error);
      throw error;
    }
  }, [user, refreshSales]);

  const value = { sales, addSale, updateSaleStatus, refreshSales };

  if (!isInitialized && user) {
    return null; // or a loading skeleton
  }

  return (
    <SalesContext.Provider value={value}>
      {children}
    </SalesContext.Provider>
  );
}

export function useSales() {
  const context = useContext(SalesContext);
  if (context === undefined) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
}
