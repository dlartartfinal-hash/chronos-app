
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  ArrowDownCircle,
  BadgePercent,
  DollarSign,
  Package,
  Users,
} from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { format, getMonth, getYear, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSales } from '@/context/sales-context';
import { formatCurrency } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import { useUser } from '@/context/user-context';
import { useInventory } from '@/context/inventory-context';

type ManualTransaction = {
  id: string;
  description: string;
  date: string;
  amount: number;
  type: 'Receita' | 'Despesa';
};

const initialManualTransactions: ManualTransaction[] = [];

const transactionFormSchema = z.object({
  description: z.string().min(3, { message: 'A descrição deve ter pelo menos 3 caracteres.' }),
  amount: z.coerce.number().positive({ message: 'O valor deve ser positivo.' }),
  type: z.enum(['Receita', 'Despesa']),
});

type Transaction = ManualTransaction;

export default function FinancasPage() {
  const { sales } = useSales();
  const { user } = useUser();
  const { products, services } = useInventory();
  const [manualTransactions, setManualTransactions] = useState<Transaction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const { toast } = useToast();

  // Carregar transações do banco de dados
  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      const data = await apiRequest<Transaction[]>('financial-transactions');
      setManualTransactions(data || []);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      toast({
        title: 'Erro ao carregar transações',
        description: 'Não foi possível carregar as transações financeiras.',
        variant: 'destructive',
      });
    }
  };

  const form = useForm<z.infer<typeof transactionFormSchema>>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: { type: 'Despesa' }
  });

  const handleOpenDialog = () => {
    form.reset({ type: 'Despesa', description: '', amount: undefined });
    setIsDialogOpen(true);
  };
  
  const onSubmit = async (values: z.infer<typeof transactionFormSchema>) => {
    try {
      const newTransaction = await apiRequest<Transaction>('financial-transactions', {
        method: 'POST',
        body: JSON.stringify({
          description: values.description,
          amount: values.amount,
          type: 'Despesa',
        }),
      });

      setManualTransactions(prev => [newTransaction, ...prev]);

      toast({
        title: 'Despesa adicionada com sucesso!',
        description: `${values.description}: ${formatCurrency(newTransaction.amount)}`,
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar despesa:', error);
      toast({
        title: 'Erro ao adicionar despesa',
        description: 'Não foi possível salvar a transação.',
        variant: 'destructive',
      });
    }
  }
  
  const monthOptions = useMemo(() => {
    const allDates = [...sales.map(s => s.date), ...manualTransactions.map(t => t.date)];
    const uniqueMonths = new Set(allDates.map(dateStr => {
      const date = parseISO(dateStr);
      return format(date, 'yyyy-MM');
    }));
    
    return Array.from(uniqueMonths).map(monthStr => {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return {
        value: monthStr,
        label: format(date, 'MMMM de yyyy', { locale: ptBR }),
      };
    }).sort((a,b) => b.value.localeCompare(a.value));
  }, [sales, manualTransactions]);

  const filteredData = useMemo(() => {
    const salesAsTransactions: ManualTransaction[] = sales
        .filter(sale => sale.status === 'Concluída')
        .map(sale => ({
            id: sale.id,
            description: `Venda #${sale.id}`,
            date: sale.date,
            amount: sale.total,
            type: 'Receita' as const
        }));
        
    const combined = [...salesAsTransactions, ...manualTransactions];

    if (selectedMonth === 'all') {
      return {
        transactions: combined.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()),
        sales: sales.filter(s => s.status === 'Concluída'),
        pendingSales: sales.filter(s => s.status === 'Pendente'),
      };
    }

    const [year, month] = selectedMonth.split('-').map(Number);
    
    const filterByMonth = (item: { date: string }) => {
        const itemDate = parseISO(item.date);
        return getYear(itemDate) === year && getMonth(itemDate) === month - 1;
    }

    return {
      transactions: combined.filter(filterByMonth).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()),
      sales: sales.filter(s => s.status === 'Concluída' && filterByMonth(s)),
      pendingSales: sales.filter(s => s.status === 'Pendente' && filterByMonth(s)),
    };
  }, [sales, manualTransactions, selectedMonth]);


  const {
    totalProductCost,
    totalFeeCost,
  } = useMemo(() => {
    let totalProductCost = 0;
    let totalFeeCost = 0;

    filteredData.sales.forEach(sale => {
      totalFeeCost += sale.fees || 0;
      sale.items.forEach(item => {
        const product = products.find(p => p.hasVariations ? p.variations?.some(v => v.sku === item.id) : p.sku === item.id);
        if (product) {
          if (product.hasVariations && product.variations) {
            const variation = product.variations.find(v => v.sku === item.id);
            totalProductCost += (variation?.cost || 0) * item.quantity;
          } else {
            totalProductCost += (product.cost || 0) * item.quantity;
          }
        } else {
          const service = services.find(s => s.code === item.id);
          if (service) {
            totalProductCost += (service.cost || 0) * item.quantity;
          }
        }
      });
    });

    return { totalProductCost, totalFeeCost };
  }, [filteredData.sales, products, services]);


  const allTransactions = filteredData.transactions;

  const totalReceitas = allTransactions
    .filter((t) => t.type === 'Receita')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalDespesas = allTransactions
    .filter((t) => t.type === 'Despesa')
    .reduce((acc, t) => acc + t.amount, 0);

  const saldoAtual = totalReceitas + totalDespesas;
  
  const contasAReceber = filteredData.pendingSales.reduce((acc, s) => acc + s.total, 0);


  const summaryCards = [
    {
      title: "Saldo Líquido",
      value: saldoAtual - totalProductCost - totalFeeCost,
      description: "Receitas - (despesas + custos)",
      icon: DollarSign
    },
     {
      title: "Custo com Produto",
      value: -totalProductCost,
      description: "Custo de produtos e serviços vendidos",
      icon: Package
    },
    {
      title: "Custo com Taxas",
      value: -totalFeeCost,
      description: "Taxas de cartão, parcelamento, etc.",
      icon: BadgePercent
    },
    {
      title: "Contas a Receber",
      value: contasAReceber,
      description: "Total de vendas em aberto (fiado)",
      icon: Users
    },
  ];

  if (!user) return null;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fluxo de Caixa</h1>
            <p className="text-muted-foreground">
              Controle seu fluxo de caixa, receitas e despesas.
            </p>
          </div>
          <div className="flex gap-2 items-center">
             <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Filtrar por mês..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Meses</SelectItem>
                    {monthOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label.charAt(0).toUpperCase() + option.label.slice(1)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleOpenDialog}>
              <ArrowDownCircle className="mr-2 h-4 w-4" />
              Nova Despesa
            </Button>
          </div>
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
                <div className="text-2xl font-bold">
                  {formatCurrency(card.value)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card 
          className="animate-fade-in-up opacity-0"
          style={{ animationDelay: `${300}ms` }}
        >
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>
              Aqui está a lista das últimas movimentações financeiras do período selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.description}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.type === 'Receita'
                            ? 'default'
                            : 'destructive'
                        }
                        className={
                          transaction.type === 'Receita'
                            ? 'bg-green-600/20 text-green-800 border-green-600/20 hover:bg-green-600/30 dark:bg-green-400/10 dark:text-green-400 dark:border-green-400/20'
                            : 'bg-red-600/20 text-red-800 border-red-600/20 hover:bg-red-600/30 dark:bg-red-400/10 dark:text-red-400 dark:border-red-400/20'
                        }
                      >
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        transaction.type === 'Receita'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            ) : (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">Nenhuma transação registrada para este período.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Despesa</DialogTitle>
            <DialogDescription>
              Preencha os dados da nova movimentação financeira.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
               <input type="hidden" {...form.register('type')} />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Pagamento de conta de luz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="150,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Adicionar Despesa</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
