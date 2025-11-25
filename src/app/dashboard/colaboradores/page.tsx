
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Edit, Trash2, Eye, EyeOff, ShieldCheck, ShieldAlert, UserPlus, UserX, AlertTriangle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { differenceInDays, parseISO } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscription } from '@/context/subscription-context';
import { useInventory, Collaborator } from '@/context/inventory-context';


const collaboratorFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  pin: z.string().length(4, { message: 'O PIN deve ter exatamente 4 dígitos.' }).regex(/^\d{4}$/, { message: 'O PIN deve conter apenas números.' }),
  canModifyItems: z.boolean().default(false),
  avatarId: z.string({ required_error: 'Por favor, selecione um avatar.'}),
  status: z.enum(['Ativo', 'Inativo']).optional(),
  createdAt: z.string().optional(),
});


const availableAvatars = PlaceHolderImages.filter(img => img.id.startsWith('user-sales-') || img.id.startsWith('user-generic-'));

export default function ColaboradoresPage() {
  const { collaborators, addCollaborator, updateCollaborator, setCollaboratorStatus } = useInventory();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
  const [visiblePin, setVisiblePin] = useState<string | null>(null);
  const { toast } = useToast();
  const { selectedPlan } = useSubscription();

  const form = useForm<z.infer<typeof collaboratorFormSchema>>({
    resolver: zodResolver(collaboratorFormSchema),
    defaultValues: { name: '', pin: '', canModifyItems: false, avatarId: '' },
  });

  const activeCollaborators = collaborators.filter(c => c.status === 'Ativo');
  const inactiveCollaborators = collaborators.filter(c => c.status === 'Inativo');

  const canAddMoreCollaborators = activeCollaborators.length < selectedPlan.maxCollaborators;

  const handleOpenDialog = (collaborator: Collaborator | null = null) => {
    setEditingCollaborator(collaborator);
    if (collaborator) {
      form.reset(collaborator);
    } else {
      form.reset({ name: '', pin: '', canModifyItems: false, avatarId: '' });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof collaboratorFormSchema>) => {
    if (editingCollaborator) {
      updateCollaborator({ ...editingCollaborator, ...values });
      toast({ title: 'Colaborador atualizado com sucesso!' });
    } else {
      if (!canAddMoreCollaborators) {
        toast({
          variant: 'destructive',
          title: 'Limite de colaboradores atingido!',
          description: `Seu plano ${selectedPlan.name} permite apenas ${selectedPlan.maxCollaborators} colaboradores ativos.`,
        });
        return;
      }
      addCollaborator(values);
      toast({ title: 'Colaborador adicionado com sucesso!' });
    }
    setIsDialogOpen(false);
  };
  
  const handleToggleStatus = (id: string, currentStatus: 'Ativo' | 'Inativo') => {
    const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
    
    if (newStatus === 'Ativo' && !canAddMoreCollaborators) {
        toast({
            variant: 'destructive',
            title: 'Limite de colaboradores atingido!',
            description: `Seu plano ${selectedPlan.name} permite apenas ${selectedPlan.maxCollaborators} colaboradores ativos. Faça um upgrade para reativar.`,
        });
        return;
    }

    setCollaboratorStatus(id, newStatus);
    toast({
      title: `Colaborador ${newStatus.toLowerCase()}!`,
    });
  };


  const CollaboratorCard = ({ collaborator, index }: { collaborator: Collaborator, index: number }) => {
    const avatarImage = PlaceHolderImages.find(img => img.id === collaborator.avatarId);
    const fallback = collaborator.name.split(' ').map(n => n[0]).join('');
    const canBeDeactivated = differenceInDays(new Date(), parseISO(collaborator.createdAt)) >= 30;

    return (
      <Card 
        key={collaborator.id} 
        className={cn(
          "flex flex-col animate-fade-in-up opacity-0",
          collaborator.status === 'Inativo' && 'opacity-60'
        )}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <CardHeader className="items-center text-center relative">
           <Badge variant={collaborator.status === 'Ativo' ? 'default' : 'secondary'} className="absolute top-2 right-2">
            {collaborator.status}
          </Badge>
          <Avatar className="h-24 w-24">
            {avatarImage && <AvatarImage src={avatarImage.imageUrl} alt={collaborator.name} data-ai-hint={avatarImage.imageHint} />}
            <AvatarFallback className="text-3xl">{fallback}</AvatarFallback>
          </Avatar>
          <CardTitle>{collaborator.name}</CardTitle>
           <CardDescription>
            Criado em: {new Date(collaborator.createdAt).toLocaleDateString('pt-BR')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-3">
           <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">PIN</span>
               <div className="flex items-center gap-1 font-semibold">
                  <span>{visiblePin === collaborator.id ? collaborator.pin : '••••'}</span>
                   <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setVisiblePin(visiblePin === collaborator.id ? null : collaborator.id)}>
                      {visiblePin === collaborator.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                   </Button>
                </div>
           </div>
           <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Gerencia Itens?</span>
              {collaborator.canModifyItems ? (
                <div className="flex items-center gap-1 font-semibold text-green-600">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Sim</span>
                </div>
              ) : (
                 <div className="flex items-center gap-1 font-semibold text-destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Não</span>
                </div>
              )}
           </div>
        </CardContent>
        <Separator />
        <CardFooter className="p-2">
            <div className="flex w-full justify-end space-x-1">
              <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(collaborator)} disabled={collaborator.status === 'Inativo'}>
                  <Edit className="h-4 w-4" />
              </Button>
               <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(collaborator.status === 'Ativo' ? 'text-destructive hover:text-destructive' : 'text-green-600 hover:text-green-600')}
                  >
                    {collaborator.status === 'Ativo' ? <UserX className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {collaborator.status === 'Ativo'
                        ? "Isso irá desativar o colaborador. Ele não poderá mais acessar o sistema, mas seu histórico será mantido."
                        : "Isso irá reativar o colaborador, permitindo que ele acesse o sistema novamente."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  {collaborator.status === 'Ativo' && !canBeDeactivated && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Colaboradores com menos de 30 dias não podem ser desativados.
                      </AlertDescription>
                    </Alert>
                  )}
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleToggleStatus(collaborator.id, collaborator.status)}
                      disabled={collaborator.status === 'Ativo' && !canBeDeactivated}
                    >
                      {collaborator.status === 'Ativo' ? 'Desativar' : 'Reativar'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
           </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Colaboradores</h1>
            <p className="text-muted-foreground">
              Você tem {activeCollaborators.length} de {selectedPlan.maxCollaborators} colaboradores ativos.
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} disabled={!canAddMoreCollaborators}>
            <PlusCircle className="mr-2" />
            Adicionar Colaborador
          </Button>
        </div>

        {!canAddMoreCollaborators && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex justify-between items-center">
              <div>
                <p className="font-semibold">Limite de Colaboradores Atingido</p>
                <p>
                  Para adicionar mais colaboradores, você precisa atualizar seu plano.
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard/assinatura">Ver Planos</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="ativos">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ativos">Ativos ({activeCollaborators.length})</TabsTrigger>
            <TabsTrigger value="inativos">Inativos ({inactiveCollaborators.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="ativos">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
              {activeCollaborators.map((collaborator, index) => (
                <CollaboratorCard key={collaborator.id} collaborator={collaborator} index={index} />
              ))}
            </div>
             {activeCollaborators.length === 0 && (
                <div className="text-center text-muted-foreground p-8">Nenhum colaborador ativo.</div>
            )}
          </TabsContent>
          <TabsContent value="inativos">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
              {inactiveCollaborators.map((collaborator, index) => (
                <CollaboratorCard key={collaborator.id} collaborator={collaborator} index={index} />
              ))}
            </div>
            {inactiveCollaborators.length === 0 && (
                <div className="text-center text-muted-foreground p-8">Nenhum colaborador inativo.</div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCollaborator ? 'Editar Colaborador' : 'Adicionar Colaborador'}</DialogTitle>
            <DialogDescription>
              Preencha os dados do colaborador. O PIN é usado para acessar o modo vendedor.
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
                      <Input placeholder="Nome completo do colaborador" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIN (4 dígitos)</FormLabel>
                    <FormControl>
                      <PasswordInput maxLength={4} placeholder="••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="canModifyItems"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Pode Adicionar/Modificar Itens?</FormLabel>
                      <FormMessage />
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
