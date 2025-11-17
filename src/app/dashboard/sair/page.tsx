'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSellerMode } from '@/context/seller-mode-context';
import { useToast } from '@/hooks/use-toast';

export default function SairPage() {
  const router = useRouter();
  const { exitSellerMode } = useSellerMode();
  const { toast } = useToast();

  useEffect(() => {
    exitSellerMode();
    toast({
      title: 'Você saiu do Modo Vendedor.',
    });
    router.replace('/dashboard');
  }, [router, exitSellerMode, toast]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <p>Saindo do modo vendedor...</p>
    </div>
  );
}
