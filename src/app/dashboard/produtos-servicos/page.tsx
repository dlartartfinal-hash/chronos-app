

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, PlusCircle, Trash2, Save, ChevronsUpDown, Check, Tag, Percent } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState, useEffect, useMemo } from 'react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from '@/components/ui/switch';
import { useInventory, Product, Service, ProductVariation, Category, productSchema, serviceSchema } from '@/context/inventory-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { cn, formatCurrency } from '@/lib/utils';
import React from 'react';
import Link from 'next/link';
import { usePromotion } from '@/context/promotion-context';
import { Label } from '@/components/ui/label';
import { generateLetterAvatar } from '@/lib/letter-avatar';
import { ProductImage } from '@/components/ui/product-image';


// --- Schemas ---
const categorySchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, { message: 'O nome da categoria deve ter pelo menos 2 caracteres.' }),
});

type Item = Product | Service;

// --- Helper Functions ---

function isProduct(item: Item): item is Product {
  return (item as Product).category !== undefined;
}

const getOverallStock = (item: Product) => {
    if (item.hasVariations && item.variations) {
        return item.variations.reduce((acc, v) => acc + v.stock, 0);
    }
    return item.stock || 0;
};

const getDisplayPrice = (item: Product) => {
    if (item.hasVariations && item.variations && item.variations.length > 0) {
        const prices = item.variations.map(v => v.price);
        return Math.min(...prices);
    }
    return item.price || 0;
}

const ItemCard = ({ item, index, handleOpenDetailsDialog }: { item: Item; index: number; handleOpenDetailsDialog: (item: Item) => void;}) => {
    const { getApplicablePromotion } = usePromotion();
    const promotion = getApplicablePromotion(item.id!);
    
    const stock = isProduct(item) ? getOverallStock(item) : undefined;
    const originalPrice = isProduct(item) ? getDisplayPrice(item) : item.price;
    const displayPrice = promotion && originalPrice ? originalPrice * (1 - promotion.discount / 100) : originalPrice;
    
    const pricePrefix = isProduct(item) && item.hasVariations && item.variations && item.variations.length > 1 ? "A partir de" : "";

    return (
        <Card
            className="flex flex-col cursor-pointer hover:border-primary transition-colors animate-fade-in-up opacity-0 relative group"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => handleOpenDetailsDialog(item)}
        >
            {promotion && (
                <Badge className="absolute top-2 right-2 z-10 bg-destructive text-destructive-foreground">
                    <Percent className="h-3 w-3 mr-1" /> {promotion.discount}% OFF
                </Badge>
            )}
            <CardHeader className="p-0">
                <div className="aspect-square relative flex items-center justify-center">
                    <ProductImage
                        imageUrl={item.imageUrl || ''}
                        name={item.name}
                        size={200}
                        className="w-full h-full rounded-t-lg"
                    />
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-1">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                {isProduct(item) && <Badge variant="outline">{item.category}</Badge>}
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between items-center text-sm">
                 <div className="flex flex-col">
                    <p className="text-sm text-muted-foreground">{pricePrefix}</p>
                    <div className="flex items-baseline gap-2">
                        <p className="font-bold text-lg text-card-foreground">
                            {formatCurrency(displayPrice || 0)}
                        </p>
                        {promotion && (
                            <p className="text-sm text-muted-foreground line-through">
                                {formatCurrency(originalPrice || 0)}
                            </p>
                        )}
                    </div>
                </div>
                {stock !== undefined && (
                    <div className="flex items-center gap-2">
                        <Badge variant={stock > 0 ? 'default' : 'destructive'}>
                            {stock} Un.
                        </Badge>
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}

const DetailsDialog = ({ 
    isOpen, 
    onOpenChange, 
    selectedItem, 
    handleDelete,
    handleOpenFormDialog 
}: { 
    isOpen: boolean, 
    onOpenChange: (open: boolean) => void, 
    selectedItem: Item | null,
    handleDelete: (item: Item) => void,
    handleOpenFormDialog: (item: Item | null, type: 'product' | 'service') => void,
}) => {
    if (!selectedItem) return null;

    const { getApplicablePromotion } = usePromotion();
    const promotion = getApplicablePromotion(selectedItem.id!);
    
    const getPriceWithDiscount = (price: number) => {
        return promotion ? price * (1 - promotion.discount / 100) : price;
    };


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{selectedItem.name}</DialogTitle>
                    <DialogDescription>
                        {isProduct(selectedItem) && selectedItem.hasVariations && selectedItem.variations
                            ? `${selectedItem.variations.length} variações em ${selectedItem.category}`
                            : isProduct(selectedItem) ? `SKU: ${selectedItem.sku || 'N/A'} | Categoria: ${selectedItem.category}`
                                : `Código: ${(selectedItem as Service).code}`
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="aspect-square relative flex items-center justify-center">
                         {promotion && (
                            <Badge className="absolute top-2 right-2 z-10 bg-destructive text-destructive-foreground">
                                <Percent className="h-3 w-3 mr-1" /> {promotion.discount}% OFF
                            </Badge>
                        )}
                        <ProductImage
                            imageUrl={selectedItem.imageUrl || ''}
                            name={selectedItem.name}
                            size={300}
                            className="w-full h-full rounded-md"
                        />
                    </div>
                    <div className="space-y-4">
                        {isProduct(selectedItem) && selectedItem.hasVariations && selectedItem.variations ? (
                            <div>
                                <h3 className="font-semibold mb-2">Variações do Produto</h3>
                                <ScrollArea className="h-64">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Variação</TableHead>
                                                <TableHead>Estoque</TableHead>
                                                <TableHead className="text-right">Preço</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedItem.variations.map(v => (
                                                <TableRow key={v.sku}>
                                                    <TableCell className="font-medium">{v.name}</TableCell>
                                                    <TableCell>{v.stock}</TableCell>
                                                     <TableCell className="text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className={cn(promotion && 'line-through text-muted-foreground text-xs')}>{formatCurrency(v.price)}</span>
                                                            {promotion && <span className="font-semibold">{formatCurrency(getPriceWithDiscount(v.price))}</span>}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </div>
                        ) : (
                            <div className="space-y-2 text-sm">
                                <div className='flex items-baseline gap-2'>
                                    <h3 className="text-3xl font-bold text-primary">{formatCurrency(getPriceWithDiscount(selectedItem.price || 0))}</h3>
                                    {promotion && <h4 className="text-xl font-medium text-muted-foreground line-through">{formatCurrency(selectedItem.price || 0)}</h4>}
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Custo:</span>
                                    <span className="font-medium">{formatCurrency(selectedItem.cost || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Margem:</span>
                                    <span className="font-medium">{formatCurrency((getPriceWithDiscount(selectedItem.price || 0)) - (selectedItem.cost || 0))} ({(100 * ((getPriceWithDiscount(selectedItem.price || 0)) - (selectedItem.cost || 0)) / (getPriceWithDiscount(selectedItem.price || 0))).toFixed(1)}%)</span>
                                </div>
                                {isProduct(selectedItem) && <div className="flex justify-between">
                                    <span className="text-muted-foreground">Estoque:</span>
                                    <span className="font-medium">{selectedItem.stock} unidades</span>
                                </div>}
                                <p className="text-muted-foreground pt-4">Uma descrição mais detalhada do {isProduct(selectedItem) ? 'produto' : 'serviço'} apareceria aqui, explicando seus benefícios, características e casos de uso.</p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="sm:justify-between">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full sm:w-auto">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Essa ação não pode ser desfeita. Isso excluirá permanentemente o item e todas as suas variações.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(selectedItem)}>
                                    Excluir
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <div className="flex gap-2 mt-2 sm:mt-0">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
                        <Button type="button" onClick={() => {
                            onOpenChange(false);
                            setTimeout(() => handleOpenFormDialog(selectedItem, isProduct(selectedItem) ? 'product' : 'service'), 150);
                        }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export const FormDialog = ({
    isOpen,
    onOpenChange,
    onSubmit,
    editingItem,
    itemType,
    categories,
    handleOpenCategoryDialog,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: Product | Service) => void;
    editingItem: Item | null;
    itemType: 'product' | 'service';
    categories: Category[];
    handleOpenCategoryDialog: () => void;
}) => {
    const productForm = useForm<Product>({
        resolver: zodResolver(productSchema),
    });

    const serviceForm = useForm<Service>({
        resolver: zodResolver(serviceSchema),
    });
    
    const [previewUrl, setPreviewUrl] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            const newId = `item-${Date.now()}`;
            if (itemType === 'product') {
              const defaultProduct: Product = {
                id: newId, name: '', imageUrl: '', category: '', hasVariations: false,
                sku: `SKU-${newId}`, stock: 0, price: 0, cost: 0, variations: [],
              };
              const currentItem = editingItem && isProduct(editingItem) ? editingItem : defaultProduct;
              productForm.reset(currentItem);
              setPreviewUrl(currentItem.imageUrl || '');
            } else {
              const defaultService: Service = {
                id: newId, name: '', code: `SERV-${newId}`, price: 0, cost: 0, imageUrl: '',
              }
              const currentItem = editingItem && !isProduct(editingItem) ? editingItem as Service : defaultService;
              serviceForm.reset(currentItem);
              setPreviewUrl(currentItem.imageUrl || '');
            }
        } else {
            setPreviewUrl('');
        }
    }, [isOpen, editingItem, itemType, productForm, serviceForm]);
    

    const form = itemType === 'product' ? productForm : serviceForm;
    const imageUrlValue = useWatch({ control: form.control, name: 'imageUrl' });

     useEffect(() => {
        setPreviewUrl(imageUrlValue as string);
     }, [imageUrlValue]);


    const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
    
    const { fields, append, remove } = useFieldArray({
        control: productForm.control,
        name: "variations",
    });

    const hasVariations = useWatch({
      control: productForm.control,
      name: 'hasVariations'
    });
    
    const handleToggleVariations = (checked: boolean) => {
      productForm.setValue('hasVariations', checked);
      if (checked) {
        // if user enables variations, convert simple product fields to first variation
        const simplePrice = productForm.getValues('price');
        const simpleStock = productForm.getValues('stock');
        const simpleSku = productForm.getValues('sku');
        const simpleCost = productForm.getValues('cost');

        if (fields.length === 0 && (simplePrice || simpleStock)) {
          append({
            name: 'Padrão',
            price: simplePrice || 0,
            stock: simpleStock || 0,
            sku: simpleSku || '',
            cost: simpleCost || 0
          });
        }
      }
    }
    
    const handleAddVariation = () => {
        append({ name: '', price: 0, stock: 0, sku: `SKU-${Date.now()}`, cost: 0 });
    }

    return (
     <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar' : 'Adicionar'} {itemType === 'product' ? 'Produto' : 'Serviço'}</DialogTitle>
            <DialogDescription>
              {itemType === 'product' 
                ? 'Preencha os dados do produto. Habilite as variações para produtos com tamanho, cor, etc.' 
                : 'Preencha os dados do novo serviço.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
              
              <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 space-y-4">
                     <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do {itemType === 'product' ? 'Produto' : 'Serviço'}</FormLabel>
                            <FormControl><Input placeholder={itemType === 'product' ? 'Ex: Camiseta Básica' : 'Ex: Instalação de Software'} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {itemType === 'product' && (
                        <FormField
                            control={productForm.control}
                            name="category"
                            render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Categoria</FormLabel>
                                <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        role="combobox"
                                        className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                    >
                                        {field.value || "Selecione uma categoria"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Buscar categoria..." />
                                        <CommandList>
                                            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                                            <CommandGroup>
                                                {categories.map((category) => (
                                                <CommandItem
                                                    value={category.name}
                                                    key={category.id}
                                                    onSelect={() => {
                                                        field.onChange(category.name);
                                                        setIsCategoryPopoverOpen(false);
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", category.name === field.value ? "opacity-100" : "opacity-0")} />
                                                    {category.name}
                                                </CommandItem>
                                                ))}
                                            </CommandGroup>
                                            <CommandSeparator />
                                            <CommandGroup>
                                                <CommandItem
                                                    onSelect={() => {
                                                        setIsCategoryPopoverOpen(false);
                                                        handleOpenCategoryDialog();
                                                    }}
                                                >
                                                    <PlusCircle className="mr-2 h-4 w-4" />
                                                    Criar nova categoria
                                                </CommandItem>
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                                </Popover>
                                <FormDescription>
                                    Organize seus produtos.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                      )}
                    <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Imagem do Produto/Serviço</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        const base64 = reader.result as string;
                                        field.onChange(base64);
                                        setPreviewUrl(base64);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="cursor-pointer"
                                />
                                <FormDescription>
                                  Envie uma imagem ou deixe em branco para usar a primeira letra do nome.
                                </FormDescription>
                              </div>
                            </FormControl>
                             {previewUrl && (
                                <div className="mt-4">
                                <Label>Pré-visualização</Label>
                                <div className="aspect-square relative w-full rounded-md overflow-hidden border mt-2 flex items-center justify-center">
                                  {previewUrl.startsWith('letter-avatar:') ? (
                                    <ProductImage 
                                      imageUrl={previewUrl}
                                      name={form.getValues('name') || 'Preview'}
                                      size={200}
                                    />
                                  ) : (
                                    <Image 
                                      src={previewUrl} 
                                      alt="Pré-visualização da imagem" 
                                      fill 
                                      className="object-cover"
                                      onError={() => setPreviewUrl('')}
                                    />
                                  )}
                                </div>
                                </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    {itemType === 'product' ? (
                       <div className='space-y-6'>
                          <FormField
                            control={productForm.control}
                            name="hasVariations"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Este produto possui variações?</FormLabel>
                                  <FormDescription>
                                    Ex: tamanho, cor, modelo.
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={handleToggleVariations}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {hasVariations ? (
                            <div className="space-y-4">
                               <div className="flex justify-between items-center">
                                  <h3 className="text-lg font-medium">Variações</h3>
                                  <Button type="button" variant="outline" size="sm" onClick={handleAddVariation}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Adicionar Variação
                                  </Button>
                               </div>
                                <ScrollArea className="h-72 pr-4 -mr-4">
                                  <div className="space-y-4">
                                      {fields.map((field, index) => (
                                       <Card key={field.id} className="p-4 relative">
                                         <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-destructive hover:text-destructive" onClick={() => remove(index)}>
                                           <Trash2 className="h-4 w-4" />
                                         </Button>
                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <FormField control={productForm.control} name={`variations.${index}.name`} render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Nome</FormLabel>
                                                    <FormControl><Input placeholder="P / Azul" {...field}/></FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )} />
                                             <FormField control={productForm.control} name={`variations.${index}.sku`} render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>SKU</FormLabel>
                                                    <FormControl><Input placeholder="SKU-AZ-P" {...field}/></FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )} />
                                         </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                             <FormField control={productForm.control} name={`variations.${index}.stock`} render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Estoque</FormLabel>
                                                    <FormControl><Input type="number" placeholder="0" value={field.value} onChange={e => field.onChange(parseInt(e.target.value) || 0)}/></FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )} />
                                            <FormField control={productForm.control} name={`variations.${index}.cost`} render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Custo (R$)</FormLabel>
                                                    <FormControl><Input type="number" step="0.01" placeholder="0,00" value={field.value} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )} />
                                             <FormField control={productForm.control} name={`variations.${index}.price`} render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Preço (R$)</FormLabel>
                                                    <FormControl><Input type="number" step="0.01" placeholder="0,00" value={field.value} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )} />
                                          </div>
                                       </Card>
                                     ))}
                                     {fields.length === 0 && <FormMessage className="p-4 text-center">{productForm.formState.errors.variations?.message}</FormMessage>}
                                  </div>
                                </ScrollArea>
                             </div>
                          ) : (
                            <div className="space-y-4 rounded-lg border p-4">
                                <FormField control={productForm.control} name="sku" render={({field}) => (
                                    <FormItem>
                                        <FormLabel>SKU (Código de Barras)</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}/>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField control={productForm.control} name="stock" render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Estoque</FormLabel>
                                            <FormControl><Input type="number" value={field.value} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}/>
                                     <FormField control={productForm.control} name="cost" render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Custo</FormLabel>
                                            <FormControl><Input type="number" step="0.01" value={field.value} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}/>
                                     <FormField control={productForm.control} name="price" render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Preço</FormLabel>
                                            <FormControl><Input type="number" step="0.01" value={field.value} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}/>
                                </div>
                            </div>
                          )}

                       </div>
                    ) : (
                      <>
                        <FormField
                          control={serviceForm.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código</FormLabel>
                              <FormControl><Input {...field} disabled={!!editingItem} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={serviceForm.control}
                            name="cost"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Custo</FormLabel>
                                <FormControl><Input type="number" step="0.01" value={field.value} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={serviceForm.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Preço</FormLabel>
                                <FormControl><Input type="number" step="0.01" value={field.value} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}
                  </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    )
}

const CategoryDialog = ({
    isOpen,
    onOpenChange,
    onSave,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (values: z.infer<typeof categorySchema>) => void;
}) => {
    const form = useForm<z.infer<typeof categorySchema>>({
        resolver: zodResolver(categorySchema),
        defaultValues: { id: undefined, name: '' },
    });
    
    useEffect(() => {
        if (!isOpen) {
            form.reset({ id: undefined, name: '' });
        }
    }, [isOpen, form]);


    const onSubmit = (values: z.infer<typeof categorySchema>) => {
        onSave(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Categoria</DialogTitle>
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


export default function ProdutosServicosPage() {
  const { products, services, categories, addProduct, updateProduct, deleteProduct, addService, updateService, deleteService, addCategory } = useInventory();
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  const [itemType, setItemType] = useState<'product' | 'service'>('product');
  const [activeTab, setActiveTab] = useState('produtos');

  const { toast } = useToast();

  // --- Dialog Handlers ---
  const handleOpenFormDialog = (item: Item | null = null, type: 'product' | 'service') => {
    setItemType(type);
    setEditingItem(item);
    setIsFormDialogOpen(true);
  };

  const handleOpenDetailsDialog = (item: Item) => {
    setSelectedItem(item);
    setIsDetailsDialogOpen(true);
  };
  
  const handleOpenCategoryDialog = () => {
    setIsCategoryDialogOpen(true);
  };

  // --- CRUD Handlers ---
  const onSubmit = async (values: Product | Service) => {
    // Se não houver imagem, gera avatar com primeira letra
    if (!values.imageUrl || values.imageUrl.trim() === '') {
      values.imageUrl = generateLetterAvatar(values.name);
    }

    try {
      if (editingItem) { // Editing
        if (isProduct(values)) {
          await updateProduct(values as Product);
          toast({ title: 'Produto atualizado com sucesso!' });
        } else {
          await updateService(values as Service);
          toast({ title: 'Serviço atualizado com sucesso!' });
        }
      } else { // Creating
        if (itemType === 'product') {
          await addProduct(values as Product);
          toast({ title: 'Produto adicionado com sucesso!' });
        } else {
          const newService = values as Service;
          if (services.some(s => s.code === newService.code)) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Este código de serviço já está em uso.'})
            return;
          }
          await addService(newService);
          toast({ title: 'Serviço adicionado com sucesso!' });
        }
      }
      setIsFormDialogOpen(false);
    } catch (error) {
      console.error('Error saving item:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao salvar', 
        description: 'Ocorreu um erro ao salvar. Tente novamente.' 
      });
    }
  };

  const handleDelete = (item: Item) => {
    setIsDetailsDialogOpen(false);
    // Timeout to prevent UI glitch
    setTimeout(() => {
        if (isProduct(item)) {
            deleteProduct(item.id!);
            toast({ title: 'Grupo de produtos excluído com sucesso!', variant: 'destructive' });
        } else {
            deleteService((item as Service).id!);
            toast({ title: 'Serviço excluído com sucesso!', variant: 'destructive' });
        }
    }, 150)
  };
  
  const handleSaveCategory = (values: z.infer<typeof categorySchema>) => {
    const newCategoryName = addCategory(values.name);
    if (newCategoryName) {
        toast({ title: 'Categoria adicionada com sucesso!' });
        
        // This is a bit of a hack to update the form's category value
        // when a new category is created from within the form dialog.
        if (isFormDialogOpen && itemType === 'product') {
            // A better solution would involve a shared state manager or more complex prop drilling
            // For now, we reopen the form which will have the new category in its props.
            const currentFormData = (document.querySelector('form') as any);
            setIsFormDialogOpen(false);
            setTimeout(() => {
                setIsFormDialogOpen(true);
            }, 100);
        }
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Produtos e Serviços</h1>
          <Button onClick={() => handleOpenFormDialog(null, activeTab === 'produtos' ? 'product' : 'service')}>
            <PlusCircle className="mr-2" />
            Adicionar {activeTab === 'produtos' ? 'Produto' : 'Serviço'}
          </Button>
        </div>

        <Tabs defaultValue="produtos" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="servicos">Serviços</TabsTrigger>
          </TabsList>
          <TabsContent value="produtos">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-4">
                {products.map((product, index) => (
                  <ItemCard key={product.id} item={product} index={index} handleOpenDetailsDialog={handleOpenDetailsDialog} />
                ))}
             </div>
             {products.length === 0 && (
                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-md mt-4">
                    Nenhum produto cadastrado.
                </div>
            )}
          </TabsContent>
          <TabsContent value="servicos">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-4">
                {services.map((service, index) => (
                  <ItemCard key={service.id} item={service} index={index} handleOpenDetailsDialog={handleOpenDetailsDialog} />
                ))}
             </div>
             {services.length === 0 && (
                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-md mt-4">
                    Nenhum serviço cadastrado.
                </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <FormDialog 
        isOpen={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        onSubmit={onSubmit}
        editingItem={editingItem}
        itemType={itemType}
        categories={categories}
        handleOpenCategoryDialog={handleOpenCategoryDialog}
      />
      <DetailsDialog 
        isOpen={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        selectedItem={selectedItem}
        handleDelete={handleDelete}
        handleOpenFormDialog={handleOpenFormDialog}
      />
      <CategoryDialog
        isOpen={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        onSave={handleSaveCategory}
      />
    </>
  );
}

    


