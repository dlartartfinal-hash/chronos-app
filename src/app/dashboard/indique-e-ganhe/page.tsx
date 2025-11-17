
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Gift, DollarSign, Users, CheckCircle, Clock, Loader2, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

type ReferralCommission = {
  id: string;
  referredUserEmail: string;
  plan: string;
  amountCents: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: string;
  paidAt: string | null;
};

type ReferralData = {
  referralCode: string;
  referredUsers: number;
  commissionEarned: number;
  commissions: ReferralCommission[];
};

export default function IndiqueEGanhePage() {
  const { toast } = useToast();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopying, setIsCopying] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);

  useEffect(() => {
    fetchReferral();
  }, []);

  const fetchReferral = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest<ReferralData>('referrals', 'GET');
      setReferralData(data);
    } catch (error) {
      console.error('Failed to fetch referral:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Tente novamente mais tarde.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!referralData) return;
    
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(referralData.referralCode);
      toast({
        title: 'Código Copiado!',
        description: 'Seu código de indicação foi copiado para a área de transferência.',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao copiar',
        description: 'Não foi possível copiar o código. Tente novamente.',
      });
    } finally {
      setIsCopying(false);
    }
  };

  const copyLinkToClipboard = async () => {
    if (!referralData) return;
    
    setIsCopyingLink(true);
    try {
      const referralLink = `${window.location.origin}/register?ref=${referralData.referralCode}`;
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: 'Link Copiado!',
        description: 'Seu link de indicação foi copiado. Compartilhe com seus amigos!',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao copiar',
        description: 'Não foi possível copiar o link. Tente novamente.',
      });
    } finally {
      setIsCopyingLink(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Erro ao carregar dados de indicação.</p>
      </div>
    );
  }

  // Calculate metrics
  const totalEarnings = referralData.commissionEarned / 100; // Convert cents to reais
  const totalReferrals = referralData.referredUsers;
  const completedReferrals = referralData.commissions.filter(c => c.status === 'PAID').length;
  const pendingReferrals = referralData.commissions.filter(c => c.status === 'PENDING').length;

  const summaryCards = [
    {
        title: 'Ganhos Totais',
        value: formatCurrency(totalEarnings),
        description: `provenientes de ${completedReferrals} indicações concluídas`,
        icon: DollarSign,
    },
    {
        title: 'Total de Indicações',
        value: totalReferrals,
        description: 'Amigos que usaram seu código',
        icon: Users,
    },
    {
        title: 'Indicações Pendentes',
        value: pendingReferrals,
        description: 'Aguardando conclusão da assinatura',
        icon: Clock,
    }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Gift className="h-8 w-8" />
          Indique e Ganhe
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          Convide seus amigos para a Chronos e, quando eles assinarem um plano (Básico ou Profissional), 
          você ganha o valor integral da primeira mensalidade deles como recompensa!
        </p>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, index) => (
            <Card 
                key={card.title}
                className="animate-fade-in-up opacity-0"
                style={{ animationDelay: `${index * 100}ms` }}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    <card.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="text-xs text-muted-foreground">
                        {card.description}
                    </p>
                </CardContent>
            </Card>
        ))}
      </div>

      <Card 
        className="bg-primary text-primary-foreground animate-fade-in-up opacity-0"
        style={{ animationDelay: '200ms' }}
      >
        <CardHeader className="text-center">
          <CardTitle>Seu Link de Indicação</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Compartilhe este link com seus amigos. Quando assinarem um plano pago, você ganha o valor da primeira mensalidade!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4">
          <div className="w-full max-w-2xl">
            <div className="bg-primary-foreground/10 rounded-lg px-4 py-3 text-center break-all">
              <p className="text-sm font-mono text-primary-foreground">
                {`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralData.referralCode}`}
              </p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            size="lg" 
            onClick={copyLinkToClipboard}
            disabled={isCopyingLink}
          >
            {isCopyingLink ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Copiando...
              </>
            ) : (
              <>
                <Copy className="mr-2" />
                Copiar Link de Indicação
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card 
        className="animate-fade-in-up opacity-0"
        style={{ animationDelay: '300ms' }}
      >
        <CardHeader>
          <CardTitle>Suas Indicações</CardTitle>
          <CardDescription>
            Acompanhe o status dos seus amigos indicados. Os dados serão atualizados automaticamente quando seus indicados assinarem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email do Indicado</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referralData.commissions.length > 0 ? (
                  referralData.commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-medium">{commission.referredUserEmail}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{commission.plan}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={commission.status === 'PAID' ? 'default' : commission.status === 'PENDING' ? 'secondary' : 'destructive'}
                        >
                          {commission.status === 'PAID' && <CheckCircle className="h-4 w-4 mr-1" />}
                          {commission.status === 'PENDING' && <Clock className="h-4 w-4 mr-1" />}
                          {commission.status === 'PAID' ? 'Pago' : commission.status === 'PENDING' ? 'Pendente' : 'Cancelada'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(commission.amountCents / 100)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">Você ainda não fez nenhuma indicação.</p>
                      <p className="text-sm mt-1">Compartilhe seu código e comece a ganhar!</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
