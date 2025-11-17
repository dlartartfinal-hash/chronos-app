
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, PlusCircle, Trash2, Mail, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Customer, useCustomer, customerSchema } from '@/context/customer-context';

const availableAvatars = PlaceHolderImages.filter(img => img.id.startsWith('user-'));

interface CustomerFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingCustomer: Customer | null;
  onSave: (customer: Customer) => void;
}

export function CustomerFormDialog({ isOpen, onOpenChange, editingCustomer, onSave }: CustomerFormDialogProps) {
  const { customers } = useCustomer();
  const form = useForm<Customer>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', email: '', phone: '', avatarId: '', status: 'Ativo' },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingCustomer) {
        form.reset(editingCustomer);
      } else {
        form.reset({ name: '', email: '', phone: '', avatarId: '', status: 'Ativo' });
      }
    }
  }, [isOpen, editingCustomer, form]);

  const onSubmit = (values: Customer) => {
     if (!editingCustomer && customers.some(c => c.email === values.email)) {
        form.setError('email', { message: 'Este e-mail já está em uso.' });
        return;
      }
    onSave(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingCustomer ? 'Editar Cliente' : 'Adicionar Cliente'}</DialogTitle>
          <DialogDescription>
            {editingCustomer ? 'Atualize as informações do cliente.' : 'Preencha os dados do novo cliente.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
                control={form.control}
                name="avatarId"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Avatar</FormLabel>
                    <FormControl>
                      <ScrollArea className="h-32 w-full">
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-5 gap-4 p-1"
                        >
                          {availableAvatars.map(avatar => (
                            <FormItem key={avatar.id} className="flex items-center justify-center">
                              <FormControl>
                                <RadioGroupItem value={avatar.id} className="sr-only" />
                              </FormControl>
                              <FormLabel className="cursor-pointer">
                                <Avatar className={`h-16 w-16 transition-all ${field.value === avatar.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                                  <AvatarImage src={avatar.imageUrl} alt={avatar.description} data-ai-hint={avatar.imageHint}/>
                                  <AvatarFallback>{avatar.id}</AvatarFallback>
                                </Avatar>
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </ScrollArea>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} disabled={!!editingCustomer}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(99) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export default function ClientesPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomer();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();


  const handleOpenDialog = (customer: Customer | null = null) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleSaveCustomer = async (values: Customer) => {
    try {
      if (editingCustomer) {
        await updateCustomer(values);
        toast({ title: 'Cliente atualizado com sucesso!' });
      } else {
        await addCustomer(values);
        toast({ title: 'Cliente adicionado com sucesso!' });
      }
    } catch (error) {
      toast({
        title: 'Erro ao salvar cliente',
        description: error instanceof Error ? error.message : 'Ocorreu um erro',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await deleteCustomer(customerId);
      toast({
        title: 'Cliente excluído com sucesso!',
        variant: 'destructive'
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir cliente',
        description: error instanceof Error ? error.message : 'Ocorreu um erro',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2" />
            Adicionar Cliente
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {customers.map((customer, index) => {
             const fallback = customer.name.split(' ').map(n => n[0]).join('').substring(0, 2);
             const avatarImage = PlaceHolderImages.find(img => img.id === customer.avatarId);
             return (
              <Card 
                key={customer.id} 
                className="flex flex-col animate-fade-in-up opacity-0"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-12 w-12">
                        {avatarImage && <AvatarImage src={avatarImage.imageUrl} alt={customer.name} data-ai-hint={avatarImage.imageHint} />}
                        <AvatarFallback>{fallback}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <CardTitle className="text-xl">{customer.name}</CardTitle>
                        <div className="mt-1">
                            <Badge
                                variant={
                                customer.status === 'Ativo' ? 'default' : 'destructive'
                                }
                            >
                                {customer.status}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="mr-2 h-4 w-4" />
                        <span>{customer.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="mr-2 h-4 w-4" />
                        <span>{customer.phone}</span>
                    </div>
                </CardContent>
                <Separator />
                <CardFooter className="p-2">
                   <div className="flex w-full justify-end space-x-1">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(customer)}>
                          <Edit className="h-4 w-4" />
                       </Button>
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
                              Essa ação não pode ser desfeita. Isso excluirá permanentemente o cliente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id!)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                   </div>
                </CardFooter>
              </Card>
             )
          })}
        </div>
      </div>

      <CustomerFormDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingCustomer={editingCustomer}
        onSave={handleSaveCustomer}
      />
    </>
  );
}
