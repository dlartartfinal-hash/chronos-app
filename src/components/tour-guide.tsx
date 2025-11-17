'use client';

import { useEffect, useState } from 'react';
import { useTour } from '@/context/tour-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface TourStep {
  title: string;
  description: string;
  target?: string; // CSS selector
  route?: string; // Route where this step should appear
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const tourSteps: TourStep[] = [
  {
    title: 'Bem-vindo ao Chronos! 🎉',
    description: 'Vamos fazer um tour rápido pelas principais funcionalidades do sistema. Você pode pular ou pausar esse guia a qualquer momento.',
    route: '/dashboard',
    position: 'center',
  },
  {
    title: 'Painel Principal',
    description: 'Aqui você tem uma visão geral do seu negócio: receita, clientes, estoque e pedidos. Os gráficos mostram o desempenho do último mês.',
    route: '/dashboard',
    position: 'center',
  },
  {
    title: 'Menu Lateral',
    description: 'Use o menu lateral para navegar entre as diferentes seções: PDV, Vendas, Produtos, Clientes, Finanças e mais.',
    route: '/dashboard',
    position: 'center',
  },
  {
    title: 'Ponto de Venda (PDV)',
    description: 'O PDV é onde você registra suas vendas. Adicione produtos ao carrinho, selecione o cliente e finalize com o método de pagamento.',
    route: '/dashboard/pdv',
    position: 'center',
  },
  {
    title: 'Produtos e Serviços',
    description: 'Gerencie seu catálogo de produtos e serviços. Adicione fotos, preços, custos, estoque e variações (como tamanho e cor).',
    route: '/dashboard/produtos-servicos',
    position: 'center',
  },
  {
    title: 'Clientes',
    description: 'Mantenha um cadastro de seus clientes para agilizar vendas e acompanhar o histórico de compras.',
    route: '/dashboard/clientes',
    position: 'center',
  },
  {
    title: 'Finanças',
    description: 'Acompanhe contas a receber, despesas e receitas. Mantenha suas finanças organizadas em um só lugar.',
    route: '/dashboard/financas',
    position: 'center',
  },
  {
    title: 'Relatórios',
    description: 'Visualize gráficos e análises detalhadas sobre suas vendas, produtos mais vendidos e desempenho por categoria.',
    route: '/dashboard/relatorios',
    position: 'center',
  },
  {
    title: 'Configurações',
    description: 'Personalize o sistema: escolha cores, configure taxas de pagamento, defina logo e informações para recibos.',
    route: '/dashboard/configuracoes',
    position: 'center',
  },
  {
    title: 'Tour Concluído! ✅',
    description: 'Agora você já conhece as principais funcionalidades. Comece cadastrando seus produtos e fazendo sua primeira venda! Você pode reativar esse guia a qualquer momento em Configurações.',
    route: '/dashboard',
    position: 'center',
  },
];

export function TourGuide() {
  const { isTourActive, currentStep, nextStep, prevStep, completeTour, stopTour } = useTour();
  const pathname = usePathname();
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const currentTourStep = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  // Check if current route matches the step's route
  const shouldShowStep = !currentTourStep?.route || pathname === currentTourStep.route;

  useEffect(() => {
    if (!isTourActive || !shouldShowStep) return;

    // Calculate position based on target or default to center
    if (currentTourStep?.target) {
      const element = document.querySelector(currentTourStep.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setPosition({
          top: rect.top + rect.height + 10,
          left: rect.left,
        });
      }
    } else {
      // Center position
      setPosition({
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 200,
      });
    }
  }, [isTourActive, currentStep, currentTourStep, shouldShowStep]);

  const handleNext = () => {
    if (isLastStep) {
      completeTour();
    } else {
      nextStep();
    }
  };

  if (!isTourActive || !shouldShowStep) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9998]" />

      {/* Tour Card */}
      <Card
        className={cn(
          'fixed z-[9999] w-[400px] shadow-2xl border-2 border-primary',
          currentTourStep?.position === 'center' && 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        )}
        style={
          currentTourStep?.position !== 'center'
            ? { top: `${position.top}px`, left: `${position.left}px` }
            : undefined
        }
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{currentTourStep?.title}</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={stopTour}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>{currentTourStep?.description}</CardDescription>
        </CardHeader>
        <CardFooter className="flex items-center justify-between">
          <div className="flex gap-1">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  index === currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={prevStep} disabled={isFirstStep}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button size="sm" onClick={handleNext}>
              {isLastStep ? 'Concluir' : 'Próximo'}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}

// Floating help button
export function TourHelpButton() {
  const { isTourActive, startTour } = useTour();

  if (isTourActive) return null;

  return (
    <Button
      size="icon"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
      onClick={startTour}
    >
      <HelpCircle className="h-6 w-6" />
    </Button>
  );
}
