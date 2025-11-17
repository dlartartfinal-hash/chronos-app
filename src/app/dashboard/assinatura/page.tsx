
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle, Loader2, ExternalLink, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSubscription, Plan } from '@/context/subscription-context';
import { useInventory } from '@/context/inventory-context';
import { useUser } from '@/context/user-context';
import { useState, useEffect } from 'react';
import { TrialStatus } from '@/components/trial-status';
import { useSearchParams, useRouter } from 'next/navigation';


export default function AssinaturaPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { 
        plans, 
        subscription,
        selectedPlan, 
        billingCycle, 
        setBillingCycle, 
        setSelectedPlan,
        isLoading
    } = useSubscription();
    const { collaborators, setCollaboratorStatus } = useInventory();
    const { user } = useUser();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);

    // Redirecionar para página de sucesso se vier do Stripe
    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        if (sessionId) {
            router.push(`/dashboard/assinatura/sucesso?session_id=${sessionId}`);
        }
    }, [searchParams, router]);

    const handleSelectPlan = async (plan: Plan) => {
        if (!user) return;

        // Definir hierarquia de planos para validação
        const planHierarchy: Record<string, number> = {
            'Básico': 1,
            'Profissional': 2,
            'Empresarial': 3,
        };

        const currentPlanLevel = planHierarchy[subscription?.plan || 'Básico'];
        const targetPlanLevel = planHierarchy[plan.name];

        // Bloquear downgrades (exceto se não tem plano ainda)
        if (subscription?.plan && targetPlanLevel < currentPlanLevel) {
            toast({
                title: "Downgrade não permitido",
                description: `Para reduzir seu plano de ${subscription.plan} para ${plan.name}, entre em contato com o suporte.`,
                variant: "destructive",
            });
            return;
        }

        // Bloquear downgrades de Empresarial
        if (subscription?.plan === 'Empresarial') {
            toast({
                title: "Entre em Contato",
                description: "Você possui o plano Empresarial. Para alterar seu plano, entre em contato com o suporte.",
            });
            return;
        }

        // Se é plano Empresarial, não redirecionar para Stripe
        if (plan.name === 'Empresarial' || plan.monthlyPrice === null) {
            toast({
                title: "Entre em Contato",
                description: "O plano Empresarial requer um desenvolvimento personalizado. Entre em contato pelo suporte.",
            });
            return;
        }

        try {
            setIsUpdating(true);
            
            // Se já tem assinatura ativa com Stripe, fazer upgrade/downgrade
            if (subscription?.stripeSubscriptionId) {
                const response = await fetch('/api/stripe/update-subscription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        plan: plan.name,
                        billingCycle,
                        userEmail: user.email,
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    toast({
                        title: "Plano atualizado!",
                        description: `Seu plano foi alterado para ${plan.name} com sucesso.`,
                    });
                    // Recarregar a página para atualizar os dados
                    window.location.reload();
                } else {
                    throw new Error(data.error || 'Erro ao atualizar plano');
                }
            } else {
                // Nova assinatura - redirecionar para checkout Stripe
                const response = await fetch('/api/stripe/create-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        plan: plan.name,
                        billingCycle,
                        userEmail: user.email,
                    }),
                });

                const data = await response.json();

                if (data.url) {
                    // Redirecionar para checkout do Stripe
                    window.location.href = data.url;
                } else {
                    throw new Error('URL de checkout não encontrada');
                }
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: "Erro ao processar",
                description: error.message || "Tente novamente mais tarde.",
            });
            setIsUpdating(false);
        }
    };

    const handleManageSubscription = async () => {
        if (!user) return;

        try {
            setIsUpdating(true);
            
            const response = await fetch('/api/stripe/create-portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: user.email }),
            });

            const data = await response.json();

            if (data.url) {
                // Redirecionar para portal do cliente Stripe
                window.location.href = data.url;
            } else {
                throw new Error('URL do portal não encontrada');
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Erro ao acessar portal",
                description: "Tente novamente mais tarde.",
            });
            setIsUpdating(false);
        }
    };

    const handleToggleBillingCycle = async (checked: boolean) => {
        try {
            setIsUpdating(true);
            await setBillingCycle(checked ? 'YEARLY' : 'MONTHLY');
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Erro ao atualizar ciclo de cobrança",
                description: "Tente novamente mais tarde.",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Planos e Preços</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Escolha o plano que melhor se adapta ao seu negócio. 30 dias de trial gratuito!
                </p>
            </div>

            {/* Mostrar status do trial */}
            <TrialStatus />

            {/* Mostrar botão de gerenciar assinatura se tiver Stripe subscription ativa */}
            {subscription?.stripeSubscriptionId && subscription.status !== 'TRIAL' && (
                <div className="flex justify-center">
                    <Button
                        variant="outline"
                        onClick={handleManageSubscription}
                        disabled={isUpdating}
                    >
                        {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Settings className="h-4 w-4 mr-2" />
                        )}
                        Gerenciar Assinatura
                    </Button>
                </div>
            )}

            <div className="flex items-center justify-center space-x-2">
                <Label htmlFor="billing-cycle">Mensal</Label>
                <Switch
                    id="billing-cycle"
                    checked={billingCycle === 'YEARLY'}
                    onCheckedChange={handleToggleBillingCycle}
                    disabled={isUpdating}
                />
                <Label htmlFor="billing-cycle" className="flex items-center">
                    Anual
                    <span className="ml-2 inline-flex items-center rounded-md bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/50 dark:text-green-300">
                        Economize 20%
                    </span>
                </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
                {plans.map((plan, index) => {
                    // Só é "plano atual" se tiver assinatura ATIVA e o nome do plano bater
                    const isSelected = subscription?.status === 'active' && subscription?.plan === plan.name;
                    const isEmpresarialUser = subscription?.plan === 'Empresarial';
                    
                    // Definir hierarquia de planos
                    const planHierarchy: Record<string, number> = {
                        'Básico': 1,
                        'Profissional': 2,
                        'Empresarial': 3,
                    };
                    
                    // Se não tem assinatura ativa, não é downgrade
                    const currentPlanLevel = subscription?.status === 'active' ? planHierarchy[subscription?.plan || ''] : 0;
                    const targetPlanLevel = planHierarchy[plan.name];
                    const isDowngrade = currentPlanLevel > 0 && targetPlanLevel < currentPlanLevel;
                    
                    const shouldDisableButton = isSelected || isUpdating || (isEmpresarialUser && plan.name !== 'Empresarial') || isDowngrade;

                    return (
                        <Card 
                            key={plan.name} 
                            className={cn(
                                "flex flex-col relative overflow-hidden animate-fade-in-up opacity-0", 
                                isSelected ? "border-primary ring-2 ring-primary" : plan.popular ? "border-primary" : ""
                            )}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {plan.popular && !isSelected && (
                                <div className="py-1 px-4 bg-primary text-primary-foreground text-center text-sm font-semibold absolute top-0 left-1/2 -translate-x-1/2 w-32 rounded-b-md">
                                    Mais Popular
                                </div>
                            )}
                             {isSelected && (
                                <div className="py-1 px-4 bg-primary text-primary-foreground text-center text-sm font-semibold absolute top-0 left-1/2 -translate-x-1/2 w-32 rounded-b-md flex items-center justify-center gap-1">
                                    <CheckCircle className="h-4 w-4" />
                                    Plano Atual
                                </div>
                            )}
                            <CardHeader className="pt-12">
                                <CardTitle>{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-6">
                                {plan.monthlyPrice !== null && plan.monthlyPrice > 0 ? (
                                    <div className="space-y-2">
                                        <div className="flex items-baseline">
                                            <span className="text-4xl font-bold">
                                            R$
                                            {billingCycle === 'MONTHLY'
                                                ? plan.monthlyPrice.toFixed(2).replace('.', ',')
                                                : (plan.monthlyPrice * 12 * 0.8 / 12).toFixed(2).replace('.', ',')}
                                            </span>
                                            <span className="ml-1 text-muted-foreground">/mês</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            30 dias de trial gratuito
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-4xl font-bold">
                                        Personalizado
                                    </div>
                                )}
                                <ul className="space-y-3 text-sm">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button 
                                    className="w-full"
                                    variant={plan.popular || isSelected ? 'default' : 'outline'}
                                    disabled={shouldDisableButton}
                                    onClick={() => handleSelectPlan(plan)}
                                >
                                    {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    {isSelected 
                                        ? 'Plano Atual' 
                                        : isDowngrade || (isEmpresarialUser && plan.name !== 'Empresarial')
                                        ? 'Entre em Contato' 
                                        : plan.cta}
                                    {!isSelected && !isDowngrade && plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
                                        <ExternalLink className="h-4 w-4 ml-2" />
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}
