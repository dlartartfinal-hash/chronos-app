'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';

export default function SucessoAssinaturaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError(true);
      setIsLoading(false);
      return;
    }

    // Verificar sessão e criar subscription imediatamente
    async function verifySession() {
      try {
        console.log('🔄 Verificando sessão do Stripe...');
        const response = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('❌ Erro ao verificar sessão:', data);
          setError(true);
        } else {
          console.log('✅ Subscription ativada:', data.subscription);
          setSubscriptionData(data.subscription);
        }
      } catch (err) {
        console.error('❌ Erro na requisição:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }

    verifySession();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Ativando sua assinatura...</p>
          <p className="text-sm text-muted-foreground">Aguarde alguns segundos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Erro</CardTitle>
            <CardDescription>
              Não foi possível processar sua assinatura. Entre em contato com o suporte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard/assinatura')} className="w-full">
              Voltar para Assinaturas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Assinatura Iniciada com Sucesso!</CardTitle>
          <CardDescription className="text-base mt-2">
            Parabéns! Você agora tem acesso completo ao plano <strong>{subscriptionData?.plan || 'Profissional'}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h3 className="font-semibold">O que acontece agora?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Você tem <strong>30 dias de trial gratuito</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Após o trial, será cobrado automaticamente</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Você pode cancelar a qualquer momento</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="w-full"
              size="lg"
            >
              Ir para Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button 
              onClick={() => router.push('/dashboard/assinatura')} 
              variant="outline"
              className="w-full"
            >
              Ver Detalhes da Assinatura
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
