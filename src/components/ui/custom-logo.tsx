
'use client';

import React, { useEffect, useState } from 'react';
import { Logo } from '../icons/logo';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/user-context';
import { apiRequest } from '@/lib/api';

export function CustomLogo() {
  const [logoContent, setLogoContent] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    const loadLogoFromDatabase = async () => {
      if (!user) return;
      
      try {
        const settings = await apiRequest<any>('settings');
        setLogoContent(settings.customLogoSvg || null);
      } catch (error) {
        console.error("Failed to load logo:", error);
      }
    };

    setIsMounted(true);
    loadLogoFromDatabase();

    // Re-check database when a logo update event happens
    const handleLogoUpdate = () => {
       loadLogoFromDatabase();
    };

    window.addEventListener('logo-updated', handleLogoUpdate);
    
    return () => {
      window.removeEventListener('logo-updated', handleLogoUpdate);
    };
  }, [user]);


  if (!isMounted) {
    return <div className="h-full w-auto" />;
  }
  
  if (logoContent) {
    return (
      <div 
        className="w-auto max-w-full flex items-center justify-center text-header-foreground h-full"
        dangerouslySetInnerHTML={{ __html: logoContent }}
      />
    );
  }

  return <Logo className={cn('h-full w-auto text-header-foreground')} />;
}
