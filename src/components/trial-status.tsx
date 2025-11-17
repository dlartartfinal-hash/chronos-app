'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/context/user-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, AlertTriangle } from 'lucide-react';

export function TrialStatus() {
  const { user } = useUser();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchTrialInfo() {
      if (!user) return;

      try {
        const response = await fetch('/api/user', {
          headers: {
            'x-user-email': user.email,
          },
        });

        if (!response.ok) return;

        const userData = await response.json();

        if (userData.trialEndsAt) {
          setTrialEndsAt(new Date(userData.trialEndsAt));
        }
      } catch (error) {
        console.error('Error fetching trial info:', error);
      }
    }

    fetchTrialInfo();
  }, [user]);

  useEffect(() => {
    if (!trialEndsAt) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const diff = trialEndsAt.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expirado');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [trialEndsAt]);

  if (!trialEndsAt) return null;

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
          'Seu período de trial de 1 dia expirou. Escolha um plano abaixo para continuar usando o sistema.'
        ) : (
          <>
            Seu trial expira em <strong>{timeLeft}</strong>. Após a expiração, você precisará assinar um plano para continuar usando o sistema.
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}
