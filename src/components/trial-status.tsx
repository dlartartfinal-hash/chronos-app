'use client';

import { useEffect, useState } from 'react';
import { useSubscription } from '@/context/subscription-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, AlertTriangle } from 'lucide-react';

export function TrialStatus() {
  const { subscription } = useSubscription();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Só mostrar se estiver em TRIAL
    if (!subscription || subscription.status !== 'TRIAL' || !subscription.trialEndsAt) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const trialEndsAt = new Date(subscription.trialEndsAt);
      const diff = trialEndsAt.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expirado');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, [subscription]);

  // Não mostrar nada se não estiver em TRIAL
  if (!subscription || subscription.status !== 'TRIAL') return null;

  return (
    <Alert variant={isExpired ? "destructive" : "default"} className="mb-6">
      {isExpired ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      <AlertTitle>
        {isExpired ? 'Trial Expirado' : 'Período de Trial'}
      </AlertTitle>
      <AlertDescription>
        {isExpired ? (
          'Seu período de trial expirou. Após a expiração, você precisará assinar um plano para continuar usando o sistema.'
        ) : (
          <>
            Seu trial expira em <strong>{timeLeft}</strong>. Após a expiração, você precisará assinar um plano para continuar usando o sistema.
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}
