'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSellerMode } from '@/context/seller-mode-context';

export function SairModoVendedorDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { exitSellerMode, ownerPin } = useSellerMode();
  const router = useRouter();

  const handleExit = async () => {
    setError('');
    
    if (pin !== ownerPin) {
      setError('PIN do proprietário incorreto. Tente novamente.');
      setPin('');
      return;
    }

    try {
      exitSellerMode();
      
      toast({
        title: 'Saindo do Modo Vendedor',
        description: 'Redirecionando para o painel principal...',
      });

      setIsOpen(false);
      setPin('');
      
      // Small delay to ensure state is updated before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      router.replace('/dashboard');
    } catch (error) {
      console.error('Error exiting seller mode:', error);
      setError('Ocorreu um erro ao sair. Tente novamente.');
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if(!open) {
      setError('');
      setPin('');
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sair do Modo Vendedor</DialogTitle>
          <DialogDescription>
            Insira o PIN do proprietário para acessar o painel administrativo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="owner-pin">PIN do Proprietário</Label>
            <Input
              id="owner-pin"
              type="password"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleExit()}
            />
          </div>
          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}
        </div>
        
        <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="button" onClick={handleExit}>Confirmar Saída</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
