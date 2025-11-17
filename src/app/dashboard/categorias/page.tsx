
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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Edit, PlusCircle, Trash2, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useInventory, Category } from '@/context/inventory-context';


const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: 'O nome da categoria deve ter pelo menos 2 caracteres.' }),
});

const CategoryDialog = ({
    isOpen,
    onOpenChange,
    editingCategory,
    onSave,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    editingCategory: Category | null;
    onSave: (values: Category) => void;
}) => {
    const form = useForm<z.infer<typeof categorySchema>>({
        resolver: zodResolver(categorySchema),
        defaultValues: { id: undefined, name: '' },
    });

    useEffect(() => {
        if (editingCategory) {
            form.reset(editingCategory);
        } else {
            form.reset({ id: undefined, name: '' });
        }
    }, [editingCategory, form, isOpen]);

    const onSubmit = (values: z.infer<typeof categorySchema>) => {
        onSave(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Categoria</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Roupas Femininas" {...field} />
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
};


export default function CategoriasPage() {
  const { categories, addCategory, updateCategory, deleteCategory, countProductsInCategory } = useInventory();
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  const handleOpenCategoryDialog = (category: Category | null = null) => {
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = (values: z.infer<typeof categorySchema>) => {
    if (editingCategory) {
        updateCategory({ id: editingCategory.id!, name: values.name! });
        toast({ title: 'Categoria atualizada com sucesso!' });
    } else {
        addCategory(values.name!);
        toast({ title: 'Categoria adicionada com sucesso!' });
    }
    setEditingCategory(null);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const productsInCategory = countProductsInCategory(categoryId);
    if (productsInCategory > 0) {
        toast({
            variant: 'destructive',
            title: 'Não é possível excluir',
            description: `Esta categoria contém ${productsInCategory} produto(s). Remova-os ou altere suas categorias primeiro.`
        });
        return;
    }
    deleteCategory(categoryId);
    toast({ title: 'Categoria excluída com sucesso!', variant: 'destructive' });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categorias de Produtos</h1>
            <p className="text-muted-foreground">Adicione, edite ou remova as categorias de produtos da sua loja.</p>
          </div>
          <Button onClick={() => handleOpenCategoryDialog()}>
            <PlusCircle className="mr-2" />
            Adicionar Categoria
          </Button>
        </div>

        <Card>
            <CardContent className="mt-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome da Categoria</TableHead>
                            <TableHead>Produtos</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map((category) => (
                            <TableRow key={category.id}>
                                <TableCell className="font-medium">{category.name}</TableCell>
                                <TableCell>{countProductsInCategory(category.id!)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenCategoryDialog(category)}>
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
                                                    Esta ação não pode ser desfeita. A exclusão só será permitida se não houver produtos associados a esta categoria.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteCategory(category.id!)}>Excluir</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {categories.length === 0 && (
                    <div className="text-center text-muted-foreground p-8">
                        Nenhuma categoria cadastrada.
                    </div>
                )}
            </CardContent>
        </Card>
      </div>

       <CategoryDialog
        isOpen={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        editingCategory={editingCategory}
        onSave={handleSaveCategory}
      />
    </>
  );
}
