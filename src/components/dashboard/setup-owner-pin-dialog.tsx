'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface SetupOwnerPinDialogProps {
  open: boolean;
  onComplete: (pin: string) => void;
}

export function SetupOwnerPinDialog({ open, onComplete }: SetupOwnerPinDialogProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    // Validation
    if (!pin || pin.length < 4) {
      toast({
        variant: 'destructive',
        title: 'PIN inválido',
        description: 'O PIN deve ter pelo menos 4 caracteres.',
      });
      return;
    }

    if (pin !== confirmPin) {
      toast({
        variant: 'destructive',
        title: 'PINs não coincidem',
        description: 'Por favor, confirme o PIN corretamente.',
      });
      return;
    }

    try {
      const response = await fetch('/api/auth/update-owner-pin', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': localStorage.getItem('app_user') 
            ? JSON.parse(localStorage.getItem('app_user')!).email 
            : '',
        },
        body: JSON.stringify({ ownerPin: pin }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar PIN');
      }

      toast({
        title: 'PIN configurado!',
        description: 'Seu PIN de proprietário foi criado com sucesso.',
      });

      onComplete(pin);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar o PIN. Tente novamente.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Configurar PIN do Proprietário
          </DialogTitle>
          <DialogDescription>
            Para sua segurança, crie um PIN que será usado para acessar o modo proprietário e configurações sensíveis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pin">Criar PIN</Label>
            <div className="relative">
              <Input
                id="pin"
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Digite seu PIN"
                className="pr-10"
                maxLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Mínimo de 4 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirmar PIN</Label>
            <div className="relative">
              <Input
                id="confirmPin"
                type={showConfirmPin ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Digite o PIN novamente"
                className="pr-10"
                maxLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={handleSubmit} className="w-full">
            Confirmar e Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
