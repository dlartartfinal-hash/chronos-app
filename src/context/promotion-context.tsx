
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useUser } from './user-context';
import { isWithinInterval, isFuture, isPast, parseISO } from 'date-fns';
import { apiRequest } from '@/lib/api';

// --- Types ---
export type Promotion = {
  id: string;
  itemId: string;
  itemName: string;
  itemType: 'product' | 'service';
  discount: number;
  startDate: string; // ISO string
  endDate: string; // ISO string
  status: 'Ativa' | 'Agendada' | 'Expirada';
};

// --- Context ---
interface PromotionContextType {
  promotions: Promotion[];
  addPromotion: (promotion: Omit<Promotion, 'id' | 'status'>) => Promise<void>;
  deletePromotion: (promotionId: string) => Promise<void>;
  getApplicablePromotion: (itemId: string) => Promotion | null;
}

const PromotionContext = createContext<PromotionContextType | undefined>(undefined);

const getPromotionStatus = (startDate: string, endDate: string): Promotion['status'] => {
    const now = new Date();
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (isPast(end)) return 'Expirada';
    if (isFuture(start)) return 'Agendada';
    if (isWithinInterval(now, { start, end })) return 'Ativa';
    return 'Expirada';
};


export function PromotionProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load promotions from database
  useEffect(() => {
    if (!user) {
      setPromotions([]);
      setIsInitialized(false);
      return;
    }

    const fetchPromotions = async () => {
      try {
        const data = await apiRequest<any[]>('promotions');
        
        // Transform and add status
        const promotionsWithStatus = data.map(p => ({
          id: p.id,
          itemId: p.productId || p.serviceId || '',
          itemName: p.itemName,
          itemType: p.itemType as 'product' | 'service',
          discount: p.discount,
          startDate: p.startDate,
          endDate: p.endDate,
          status: getPromotionStatus(p.startDate, p.endDate),
        }));
        
        setPromotions(promotionsWithStatus);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error fetching promotions:', error);
        setPromotions([]);
        setIsInitialized(true);
      }
    };

    fetchPromotions();
  }, [user]);

  // Periodically update statuses
  useEffect(() => {
    const interval = setInterval(() => {
        setPromotions(prev => prev.map(p => ({
            ...p,
            status: getPromotionStatus(p.startDate, p.endDate)
        })));
    }, 1000 * 60); // every minute

    return () => clearInterval(interval);
  }, []);

  const addPromotion = useCallback(async (promotion: Omit<Promotion, 'id' | 'status'>) => {
    if (!user) return;
    
    try {
      const status = getPromotionStatus(promotion.startDate, promotion.endDate);
      
      const newPromotion = await apiRequest<any>('promotions', {
        method: 'POST',
        body: JSON.stringify({
          ...promotion,
          status,
        }),
      });

      // Add to local state with calculated status
      setPromotions(prev => {
        const promotion: Promotion = {
          id: newPromotion.id,
          itemId: newPromotion.productId || newPromotion.serviceId || '',
          itemName: newPromotion.itemName,
          itemType: newPromotion.itemType as 'product' | 'service',
          discount: newPromotion.discount,
          startDate: newPromotion.startDate,
          endDate: newPromotion.endDate,
          status: getPromotionStatus(newPromotion.startDate, newPromotion.endDate),
        };
        return [...prev, promotion].sort((a,b) => parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime());
      });
    } catch (error) {
      console.error('Error adding promotion:', error);
      throw error;
    }
  }, [user]);
  
  const deletePromotion = useCallback(async (promotionId: string) => {
    if (!user) return;
    
    try {
      await apiRequest(`promotions?id=${promotionId}`, {
        method: 'DELETE',
      });
      
      setPromotions(prev => prev.filter(p => p.id !== promotionId));
    } catch (error) {
      console.error('Error deleting promotion:', error);
      throw error;
    }
  }, [user]);
  
  const getApplicablePromotion = useCallback((itemId: string): Promotion | null => {
    const promotion = promotions.find(p => p.itemId === itemId && p.status === 'Ativa');
    return promotion || null;
  }, [promotions]);

  const value = { promotions, addPromotion, deletePromotion, getApplicablePromotion };

  if (!isInitialized && user) {
    return null; // or a loading skeleton
  }

  return (
    <PromotionContext.Provider value={value}>
      {children}
    </PromotionContext.Provider>
  );
}

export function usePromotion() {
  const context = useContext(PromotionContext);
  if (context === undefined) {
    throw new Error('usePromotion must be used within a PromotionProvider');
  }
  return context;
}
