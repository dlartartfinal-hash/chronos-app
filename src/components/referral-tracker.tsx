'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const REFERRAL_COOKIE_NAME = 'chronos_referral_code';
const COOKIE_EXPIRY_DAYS = 30;

export function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    
    if (refCode && refCode.startsWith('CHRONOS-')) {
      // Validar formato do código (CHRONOS-XXXXX)
      const codePattern = /^CHRONOS-[A-Z0-9]{5}$/;
      
      if (codePattern.test(refCode)) {
        // Salvar código no cookie por 30 dias
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
        
        document.cookie = `${REFERRAL_COOKIE_NAME}=${refCode}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
      }
    }
  }, [searchParams]);

  return null; // Componente invisível
}

// Helper para ler o código do cookie
export function getReferralCode(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const referralCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${REFERRAL_COOKIE_NAME}=`)
  );
  
  if (referralCookie) {
    return referralCookie.split('=')[1];
  }
  
  return null;
}
