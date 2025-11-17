
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Input } from '@/components/ui/input';
import { HandCoins, User, PiggyBank, CircleAlert } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useSales, Sale } from '@/context/sales-context';
import { formatCurrency, formatPaymentMethod } from '@/lib/utils';
import { useCustomer, Customer } from '@/context/customer-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


type CustomerWithDebt = Customer & {
  debt: number;
  pendingSales: Sale[];
};

const paymentFormSchema = z.object({
  amount: z.coerce.number().positive({ message: 'O valor deve ser maior que zero.' }),
});

export default function ContasAReceberPage() {
  const { sales, updateSaleStatus } = useSales();
  const { customers } = useCustomer();
  const { toast } = useToast();

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithDebt | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
  });

  const customersWithDebt = useMemo(() => {
    const debtMap: { [key: string]: CustomerWithDebt } = {};

    sales.forEach(sale => {
      if (sale.status === 'Pendente') {
        const customer = customers.find(c => c.name === sale.client);
        if (customer) {
          if (!debtMap[customer.id!]) {
            debtMap[customer.id!] = {
              ...customer,
              debt: 0,
              pendingSales: [],
            };
          }
          debtMap[customer.id!].debt += sale.total;
          debtMap[customer.id!].pendingSales.push(sale);
        }
      }
    });

    return Object.values(debtMap).sort((a, b) => b.debt - a.debt);
  }, [sales, customers]);

  const totalAccountsReceivable = useMemo(() => {
    return customersWithDebt.reduce((acc, customer) => acc + customer.debt, 0);
  }, [customersWithDebt]);

  const handleOpenPaymentDialog = (customer: CustomerWithDebt) => {
    setSelectedCustomer(customer);
    form.reset({ amount: undefined }); // Clear previous amount
    setIsPaymentDialogOpen(true);
  };
  
  const onSubmitPayment = async (values: z.infer<typeof paymentFormSchema>) => {
    if (!selectedCustomer) return;

    let paymentAmount = values.amount;
    let amountPaid = 0;

    // Sort sales by date to pay off the oldest ones first
    const sortedSales = [...selectedCustomer.pendingSales].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    try {
      for (const sale of sortedSales) {
        if (paymentAmount <= 0) break;

        if (paymentAmount >= sale.total) {
          await updateSaleStatus(sale.id, 'Concluída');
          paymentAmount -= sale.total;
          amountPaid += sale.total;
        } else {
          // Here you could implement partial payments on a sale,
          // but for now, we only settle full sales.
          // So if the payment is not enough, we stop.
          break;
        }
      }
      
      toast({
          title: 'Pagamento Registrado!',
          description: `${selectedCustomer.name} pagou ${formatCurrency(amountPaid)}.`,
      });

      setIsPaymentDialogOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao registrar pagamento',
        description: 'Ocorreu um erro ao atualizar o status das vendas.',
      });
    }
  };


  return (
    <>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Contas a Receber (Fiado)</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe os pagamentos pendentes de seus clientes.
          </p>
        </div>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Total a Receber</CardTitle>
                <PiggyBank className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold">{formatCurrency(totalAccountsReceivable)}</p>
                <p className="text-xs text-muted-foreground">
                    Soma de todas as dívidas pendentes de clientes.
                </p>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes Devedores</CardTitle>
            <CardDescription>
              Lista de clientes com pagamentos pendentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customersWithDebt.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vendas Pendentes</TableHead>
                    <TableHead className="text-right">Dívida Total</TableHead>
                    <TableHead className="w-[140px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customersWithDebt.map((customer) => {
                        const avatarImage = PlaceHolderImages.find(img => img.id === customer.avatarId);
                        const fallback = customer.name.split(' ').map(n => n[0]).join('');

                        return (
                            <TableRow key={customer.id}>
                                <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        {avatarImage && <AvatarImage src={avatarImage.imageUrl} alt={customer.name} data-ai-hint={avatarImage.imageHint}/>}
                                        <AvatarFallback>{fallback}</AvatarFallback>
                                    </Avatar>
                                    <div className="font-medium">{customer.name}</div>
                                </div>
                                </TableCell>
                                <TableCell className="text-center">{customer.pendingSales.length}</TableCell>
                                <TableCell className="text-right font-semibold text-destructive">{formatCurrency(customer.debt)}</TableCell>
                                <TableCell className="text-right">
                                    <Button onClick={() => handleOpenPaymentDialog(customer)}>
                                        <HandCoins className="mr-2 h-4 w-4" />
                                        Registrar Pagamento
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
                </Table>
            ) : (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">Nenhum cliente com pagamento pendente.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

       <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento de {selectedCustomer?.name}</DialogTitle>
            <DialogDescription>
              A dívida total do cliente é de <span className="font-bold text-destructive">{formatCurrency(selectedCustomer?.debt || 0)}</span>.
              Insira o valor que o cliente está pagando.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
              <h4 className="font-semibold mb-2">Vendas Pendentes</h4>
              <ScrollArea className="h-60 border rounded-md">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Venda</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {selectedCustomer?.pendingSales.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(sale => (
                            <TableRow key={sale.id}>
                                <TableCell>{sale.id}</TableCell>
                                <TableCell>{new Date(sale.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(sale.total)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </ScrollArea>
              <Separator className="my-4" />
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitPayment)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor do Pagamento (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="Ex: 50.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                    {form.watch('amount') > (selectedCustomer?.debt || 0) && (
                        <p className="text-sm text-yellow-600 flex items-center gap-1">
                            <CircleAlert className="h-4 w-4" />
                            O valor inserido é maior que a dívida total.
                        </p>
                    )}
                   <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                    Cancelar
                    </Button>
                    <Button type="submit">Salvar Pagamento</Button>
                </DialogFooter>
                </form>
              </Form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
