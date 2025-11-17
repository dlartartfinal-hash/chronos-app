
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
import {
  PlusCircle,
  Trash2,
  Calendar as CalendarIcon,
  ChevronsUpDown,
  Check,
  Percent,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useInventory, Product, Service } from '@/context/inventory-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Promotion, usePromotion } from '@/context/promotion-context';

type Item = (Product | Service) & { type: 'product' | 'service' };

const promotionSchema = z.object({
  id: z.string().optional(),
  itemId: z.string({ required_error: 'Selecione um item.' }),
  itemName: z.string(),
  itemType: z.enum(['product', 'service']),
  discount: z.coerce.number().min(1, 'O desconto deve ser de no mínimo 1%.').max(100, 'O desconto não pode passar de 100%.'),
  dates: z.object({
    from: z.date({ required_error: 'A data de início é obrigatória.' }),
    to: z.date({ required_error: 'A data de término é obrigatória.' }),
  }),
});

const PromotionFormDialog = ({
  isOpen,
  onOpenChange,
  onSave,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (promotion: Omit<Promotion, 'id' | 'status'>) => void;
}) => {
  const { products, services } = useInventory();
  const [isItemPopoverOpen, setIsItemPopoverOpen] = useState(false);
  const allItems: Item[] = useMemo(() => [
    ...products.map(p => ({ ...p, type: 'product' as const })),
    ...services.map(s => ({ ...s, type: 'service' as const }))
  ], [products, services]);

  const form = useForm<z.infer<typeof promotionSchema>>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      dates: { from: undefined, to: undefined },
      discount: 0,
    },
  });

  useEffect(() => {
    if (!isOpen) form.reset();
  }, [isOpen, form]);

  const onSubmit = (values: z.infer<typeof promotionSchema>) => {
    onSave({
      itemId: values.itemId,
      itemName: values.itemName,
      itemType: values.itemType,
      discount: values.discount,
      startDate: values.dates.from.toISOString(),
      endDate: values.dates.to.toISOString(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Promoção</DialogTitle>
          <DialogDescription>
            Selecione um item, a porcentagem de desconto e o período da promoção.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Item em Promoção</FormLabel>
                  <Popover open={isItemPopoverOpen} onOpenChange={setIsItemPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                        >
                          {field.value
                            ? allItems.find((item) => (item.id === field.value))?.name
                            : 'Selecione um produto ou serviço'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar item..." />
                        <CommandList>
                          <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                          <CommandGroup>
                            {allItems.map((item) => (
                              <CommandItem
                                value={item.name}
                                key={item.id}
                                onSelect={() => {
                                  form.setValue('itemId', item.id!);
                                  form.setValue('itemName', item.name);
                                  form.setValue('itemType', item.type);
                                  setIsItemPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn('mr-2 h-4 w-4', item.id === field.value ? 'opacity-100' : 'opacity-0')}
                                />
                                {item.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Desconto (%)</FormLabel>
                    <div className="relative">
                        <FormControl>
                            <Input type="number" placeholder="Ex: 15" {...field} className="pl-8"/>
                        </FormControl>
                        <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                    <FormMessage />
                </FormItem>
                )}
            />

            <FormField
              control={form.control}
              name="dates"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Período da Promoção</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn('w-full justify-start text-left font-normal', !field.value?.from && 'text-muted-foreground')}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value?.from ? (
                            field.value.to ? (
                              <>
                                {format(field.value.from, 'dd/MM/yy')} - {format(field.value.to, 'dd/MM/yy')}
                              </>
                            ) : (
                              format(field.value.from, 'dd/MM/yy')
                            )
                          ) : (
                            <span>Selecione as datas</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={field.value?.from}
                        selected={field.value as DateRange}
                        onSelect={field.onChange}
                        numberOfMonths={2}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Promoção</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default function PromocoesPage() {
  const { promotions, addPromotion, deletePromotion } = usePromotion();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const handleSave = async (data: Omit<Promotion, 'id' | 'status'>) => {
    try {
      await addPromotion(data);
      toast({ title: 'Promoção criada com sucesso!' });
    } catch (error) {
      toast({ 
        title: 'Erro ao criar promoção', 
        description: 'Tente novamente.',
        variant: 'destructive' 
      });
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      await deletePromotion(id);
      toast({ title: 'Promoção removida com sucesso!', variant: 'destructive' });
    } catch (error) {
      toast({ 
        title: 'Erro ao remover promoção', 
        description: 'Tente novamente.',
        variant: 'destructive' 
      });
    }
  }

  const getStatusBadge = (status: Promotion['status']) => {
    switch (status) {
      case 'Ativa':
        return <Badge className="bg-green-600/20 text-green-800 border-green-600/20 hover:bg-green-600/30 dark:bg-green-400/10 dark:text-green-400 dark:border-green-400/20">{status}</Badge>;
      case 'Agendada':
        return <Badge variant="secondary">{status}</Badge>;
      case 'Expirada':
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Promoções</h1>
            <p className="text-muted-foreground">Crie e gerencie descontos para seus produtos e serviços.</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2" />
            Nova Promoção
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Promoções Ativas e Agendadas</CardTitle>
            <CardDescription>
                Esta é a lista de todas as suas promoções. As promoções expiram automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.length > 0 ? promotions.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-medium">{promo.itemName}</TableCell>
                    <TableCell>{promo.discount}%</TableCell>
                    <TableCell>
                      {format(new Date(promo.startDate), 'dd/MM/yy')} - {format(new Date(promo.endDate), 'dd/MM/yy')}
                    </TableCell>
                    <TableCell>{getStatusBadge(promo.status)}</TableCell>
                    <TableCell className="text-right">
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      Esta ação não pode ser desfeita e removerá a promoção permanentemente.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(promo.id)}>Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            Nenhuma promoção cadastrada.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <PromotionFormDialog isOpen={isFormOpen} onOpenChange={setIsFormOpen} onSave={handleSave} />
    </>
  );
}
