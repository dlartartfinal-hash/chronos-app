'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/context/user-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Award,
  Loader2,
  Shield,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AdminPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    async function checkAdminAccess() {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/admin/stats', {
          headers: { 'x-user-email': user.email },
        });

        if (response.status === 403) {
          router.push('/dashboard');
          return;
        }

        const data = await response.json();
        setStats(data.stats);
        setCommissions(data.commissions);
        setUsers(data.users);
      } catch (error) {
        console.error('Erro ao carregar dados admin:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminAccess();
  }, [user, router]);

  const handleApproveCommission = async (commissionId: string) => {
    try {
      const response = await fetch('/api/admin/approve-commission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user!.email,
        },
        body: JSON.stringify({ commissionId }),
      });

      if (response.ok) {
        // Recarregar dados
        window.location.reload();
      }
    } catch (error) {
      console.error('Erro ao aprovar comissão:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeSubscriptions || 0} assinaturas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {((stats?.monthlyRevenue || 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">MRR (Monthly Recurring Revenue)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {((stats?.pendingCommissions || 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingCount || 0} pagamentos pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Indicações</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeReferrers || 0} indicadores ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="commissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comissões Pendentes</CardTitle>
              <CardDescription>
                Aprove os pagamentos de comissões para os indicadores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Indicador</TableHead>
                    <TableHead>Indicado</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-medium">
                        {commission.referral.user.email}
                      </TableCell>
                      <TableCell>{commission.referredUserEmail}</TableCell>
                      <TableCell>{commission.plan}</TableCell>
                      <TableCell>
                        R$ {(commission.amountCents / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            commission.status === 'PAID'
                              ? 'default'
                              : commission.status === 'PENDING'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {commission.status === 'PAID' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {commission.status === 'PENDING' && <Clock className="h-3 w-3 mr-1" />}
                          {commission.status === 'CANCELLED' && <XCircle className="h-3 w-3 mr-1" />}
                          {commission.status === 'PAID' ? 'Pago' : commission.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {commission.status === 'PENDING' && (
                          <Button
                            size="sm"
                            onClick={() => handleApproveCommission(commission.id)}
                          >
                            Aprovar Pagamento
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Usuários</CardTitle>
              <CardDescription>
                Visualize e gerencie todos os usuários da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        {u.subscription?.plan || 'Sem plano'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            u.subscription?.status === 'ACTIVE'
                              ? 'default'
                              : u.subscription?.status === 'TRIAL'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {u.subscription?.status || 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
