

'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { ProductImage } from '@/components/ui/product-image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  PlusCircle,
  ShoppingCart,
  Search,
  MinusCircle,
  XCircle,
  ChevronsUpDown,
  Check,
  UserPlus,
  ShoppingBag,
  Wrench,
  Percent,
  Printer,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn, formatCurrency } from '@/lib/utils';
import React from 'react';
import { paymentMethods } from '@/lib/payment-methods';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useInventory, Product, Service, Category } from '@/context/inventory-context';
import { useCustomer, Customer } from '@/context/customer-context';
import { useSales, Sale } from '@/context/sales-context';
import { useSellerMode } from '@/context/seller-mode-context';
import { useUser } from '@/context/user-context';
import { CustomerFormDialog } from '../clientes/page';
import { usePromotion } from '@/context/promotion-context';
import { FormDialog as ProductFormDialog } from '../produtos-servicos/page';
import { Switch } from '@/components/ui/switch';
import { renderToString } from 'react-dom/server';
import { PrintableReceipt } from '@/components/dashboard/printable-receipt';
import { ToastAction } from '@/components/ui/toast';


// --- TYPES ---
type ProductVariation = Exclude<Product['variations'], undefined>[0];
type Item = (Product | Service) & { type: 'product' | 'service' };
export type CartItem = { 
  id: string, 
  productId?: string, // UUID do produto
  serviceId?: string, // UUID do serviço
  variationId?: string, // UUID da variação (se aplicável)
  name: string,
  price: number,
  originalPrice: number,
  cost?: number, // Custo unitário
  quantity: number,
  imageUrl: string,
  promotionId?: string,
  selectedVariation?: string,
};

type PaymentRates = Record<string, string | string[]>;

const ItemCard = React.memo(({ item, onAddItem }: { item: Item, onAddItem: (item: Item, e?: React.MouseEvent) => void }) => {
  const { getApplicablePromotion } = usePromotion();
  const promotion = getApplicablePromotion(item.id!);

  const isProduct = item.type === 'product';

  const getPrice = (price: number) => {
    if (promotion) {
      return price * (1 - promotion.discount / 100);
    }
    return price;
  };
  
  const displayPrice = isProduct && item.hasVariations 
    ? (item.variations && item.variations.length > 0 ? getPrice(Math.min(...item.variations.map(v => v.price))) : 0)
    : getPrice(item.price || 0);

  const originalPrice = isProduct && item.hasVariations 
    ? (item.variations && item.variations.length > 0 ? Math.min(...item.variations.map(v => v.price)) : 0)
    : item.price || 0;


  return (
    <Card 
        className="flex flex-col group relative overflow-hidden h-full"
        onClick={(e) => onAddItem(item, e)}
    >
        {promotion && (
            <Badge className="absolute top-2 right-2 z-10 bg-destructive text-destructive-foreground">
                <Percent className="h-3 w-3 mr-1" /> {promotion.discount}% OFF
            </Badge>
        )}
      <CardContent className="p-3 flex-shrink-0 cursor-pointer">
        <div className="aspect-square relative flex items-center justify-center bg-muted rounded-md overflow-hidden mb-3">
          <div className="relative w-full h-full">
            <ProductImage
              imageUrl={item.imageUrl || ''}
              name={item.name}
              size={200}
              className="w-full h-full object-cover"
            />
          </div>
           <Badge variant="secondary" className="absolute top-2 left-2 z-10">
            {isProduct ? <ShoppingBag className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
             <span className="ml-1.5">{isProduct ? 'Produto' : 'Serviço'}</span>
          </Badge>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">{item.name}</h3>
          
          <div className="space-y-1">
            {isProduct && item.hasVariations && (
              <p className="text-xs text-muted-foreground">A partir de</p>
            )}
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-bold text-card-foreground">
                {formatCurrency(displayPrice || 0)}
              </p>
              {promotion && (
                <p className="text-sm text-muted-foreground line-through">
                  {formatCurrency(originalPrice || 0)}
                </p>
              )}
            </div>
          </div>
          
          <Button
            size="sm"
            className="w-full"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onAddItem(item, e);
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
ItemCard.displayName = 'ItemCard';

const ItemList = React.memo(({ items, onAddItem }: { items: Item[], onAddItem: (item: Item, e?: React.MouseEvent) => void }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onAddItem={onAddItem} />
      ))}
    </div>
  );
});
ItemList.displayName = 'ItemList';

// Category Form Dialog Component
const CategoryFormDialog = ({
  isOpen,
  onOpenChange,
  onSave,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (categoryName: string) => void;
}) => {
  const [categoryName, setCategoryName] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryName.trim().length < 2) {
      return;
    }
    onSave(categoryName);
    setCategoryName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Categoria</DialogTitle>
          <DialogDescription>
            Adicione uma nova categoria para organizar seus produtos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category-name">Nome da Categoria</Label>
            <Input
              id="category-name"
              placeholder="Ex: Roupas Femininas"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              minLength={2}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={categoryName.trim().length < 2}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


export default function PdvPage() {
  const { products, services, addProduct, categories, addCategory } = useInventory();
  const { customers, addCustomer } = useCustomer();
  const { addSale } = useSales();
  const { currentCollaborator } = useSellerMode();
  const { getApplicablePromotion } = usePromotion();
  const { user } = useUser();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isVariationSelectorOpen, setIsVariationSelectorOpen] = useState(false);
  const [itemForVariationSelection, setItemForVariationSelection] = useState<Product | null>(null);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<string>('1');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentRates, setPaymentRates] = useState<PaymentRates>({});
  const { toast } = useToast();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerComboboxOpen, setIsCustomerComboboxOpen] = useState(false);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [passFeeToCustomer, setPassFeeToCustomer] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  const allItems: Item[] = useMemo(() => {
    return [
      ...products.map(p => ({ ...p, type: 'product' as const })),
      ...services.map(s => ({ ...s, type: 'service' as const }))
    ];
  }, [products, services]);

  useEffect(() => {
    const defaultCustomer = customers.find(c => c.email === 'consumidor@final.com');
    setSelectedCustomer(defaultCustomer || (customers.length > 0 ? customers[0] : null));
  }, [customers]);
  
  // Load payment rates from settings
  useEffect(() => {
    async function loadPaymentRates() {
      if (!user) return;
      
      try {
        const response = await fetch('/api/settings', {
          headers: {
            'x-user-email': user.email,
          },
        });
        
        if (response.ok) {
          const settings = await response.json();
          console.log('Settings loaded:', settings);
          
          if (settings.paymentRates) {
            const rates = JSON.parse(settings.paymentRates);
            console.log('Payment rates parsed:', rates);
            setPaymentRates(rates);
          } else {
            console.log('No payment rates found, using defaults');
            // Set default rates if none configured
            const defaultRates = {
              'Débito': '1.99',
              'Pix': '0.99',
              'Crédito': [
                '2.99', '4.59', '5.99', '7.89', '9.29', '10.99',
                '12.59', '14.09', '15.89', '17.49', '19.99', '21.99'
              ],
            };
            setPaymentRates(defaultRates);
          }
        }
      } catch (error) {
        console.error('Error loading payment rates:', error);
      }
    }
    
    loadPaymentRates();
  }, [user]);
  
  // Reset fee switch when payment method changes
  useEffect(() => {
    setPassFeeToCustomer(false);
  }, [selectedPaymentMethod]);

  const handleAddItem = useCallback((item: Item, e?: React.MouseEvent) => {
    if (e) {
        e.stopPropagation();
    }
    if (item.type === 'service' || (item.type === 'product' && !item.hasVariations)) {
      const simpleProductOrService = item as (Service | (Product & { hasVariations: false }));
      
      // Check stock for products
      if (item.type === 'product') {
        const currentStock = simpleProductOrService.stock || 0;
        const cartId = simpleProductOrService.sku!;
        const itemInCart = cartItems.find((i) => i.id === cartId);
        const quantityInCart = itemInCart ? itemInCart.quantity : 0;
        
        if (currentStock <= 0) {
          toast({
            variant: 'destructive',
            title: 'Produto sem estoque',
            description: `${simpleProductOrService.name} está com estoque zerado.`,
          });
          return;
        }
        
        if (quantityInCart >= currentStock) {
          toast({
            variant: 'destructive',
            title: 'Estoque insuficiente',
            description: `${simpleProductOrService.name} possui apenas ${currentStock} unidade(s) disponível(is).`,
          });
          return;
        }
      }
      
      const cartId = item.type === 'product' ? simpleProductOrService.sku! : simpleProductOrService.code;
      const promotion = getApplicablePromotion(item.id!);
      const originalPrice = simpleProductOrService.price!;
      const finalPrice = promotion ? originalPrice * (1 - promotion.discount / 100) : originalPrice;
      const cost = simpleProductOrService.cost || 0;
      
      setCartItems((prevItems) => {
        const itemInCart = prevItems.find((i) => i.id === cartId);
        if (itemInCart) {
          return prevItems.map((i) =>
            i.id === cartId ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [...prevItems, { 
          id: cartId,
          productId: item.type === 'product' ? item.id : undefined,
          serviceId: item.type === 'service' ? item.id : undefined,
          name: simpleProductOrService.name,
          price: finalPrice,
          originalPrice: originalPrice,
          cost: cost,
          quantity: 1,
          imageUrl: simpleProductOrService.imageUrl,
          promotionId: promotion?.id
        }];
      });
      return;
    }

    if (item.type === 'product' && item.hasVariations) {
      setItemForVariationSelection(item);
      setIsVariationSelectorOpen(true);
    }
  }, [getApplicablePromotion, cartItems, toast]);

  const handleSelectVariation = (variation: ProductVariation) => {
    // Check stock for variation
    const currentStock = variation.stock || 0;
    const cartId = variation.sku || `${itemForVariationSelection?.id}-${variation.name}`;
    const itemInCart = cartItems.find((i) => i.id === cartId);
    const quantityInCart = itemInCart ? itemInCart.quantity : 0;
    
    if (currentStock <= 0) {
      toast({
        variant: 'destructive',
        title: 'Variação sem estoque',
        description: `${itemForVariationSelection?.name} (${variation.name}) está com estoque zerado.`,
      });
      return;
    }
    
    if (quantityInCart >= currentStock) {
      toast({
        variant: 'destructive',
        title: 'Estoque insuficiente',
        description: `${itemForVariationSelection?.name} (${variation.name}) possui apenas ${currentStock} unidade(s) disponível(is).`,
      });
      return;
    }
    
    const promotion = getApplicablePromotion(itemForVariationSelection!.id!);
    const originalPrice = variation.price;
    const finalPrice = promotion ? originalPrice * (1 - promotion.discount / 100) : originalPrice;
    const cost = variation.cost || 0;
    
    setCartItems((prevItems) => {
      const itemInCart = prevItems.find((i) => i.id === cartId);
      if (itemInCart) {
        return prevItems.map((i) =>
          i.id === cartId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevItems, { 
        id: cartId, 
        productId: itemForVariationSelection!.id,
        variationId: variation.id,
        name: `${itemForVariationSelection?.name} (${variation.name})`,
        price: finalPrice,
        originalPrice: originalPrice,
        cost: cost,
        quantity: 1,
        imageUrl: itemForVariationSelection!.imageUrl,
        promotionId: promotion?.id
      }];
    });

    setIsVariationSelectorOpen(false);
    setItemForVariationSelection(null);
  };


  const handleRemoveFromCart = (cartId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== cartId)
    );
  };

  const handleUpdateQuantity = (cartId: string, quantity: number) => {
    if (quantity === 0) {
      handleRemoveFromCart(cartId);
      return;
    }
    
    // Find the cart item
    const cartItem = cartItems.find((i) => i.id === cartId);
    if (!cartItem) return;
    
    // Check stock for products
    if (cartItem.productId) {
      let availableStock = 0;
      let itemName = cartItem.name;
      
      if (cartItem.variationId) {
        // Product with variation
        const product = products.find(p => p.id === cartItem.productId);
        const variation = product?.variations?.find(v => v.id === cartItem.variationId);
        availableStock = variation?.stock || 0;
      } else {
        // Simple product
        const product = products.find(p => p.id === cartItem.productId);
        availableStock = product?.stock || 0;
      }
      
      if (quantity > availableStock) {
        toast({
          variant: 'destructive',
          title: 'Estoque insuficiente',
          description: `${itemName} possui apenas ${availableStock} unidade(s) disponível(is).`,
        });
        return;
      }
    }
    
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === cartId ? { ...item, quantity } : item
      )
    );
  };
  
  const handleClearCart = () => {
    setCartItems([]);
  };
  
  const handleOpenProductForm = () => {
    setIsProductFormOpen(true);
  };

  const handleSaveProduct = (values: Product | Service) => {
     addProduct(values as Product);
     toast({ title: 'Produto adicionado com sucesso!' });
     setIsProductFormOpen(false);
     setSearchTerm(values.name);
  };

  const handleSaveCategory = (categoryName: string) => {
    addCategory(categoryName);
    toast({ title: 'Categoria adicionada com sucesso!' });
    setIsCategoryFormOpen(false);
  };

  const handleSaveCustomer = (customer: Customer) => {
    const newCustomer = { ...customer, id: `cust-${Date.now()}` };
    addCustomer(newCustomer);
    toast({ title: 'Cliente adicionado com sucesso!' });
    // Automatically select the new customer
    setSelectedCustomer(newCustomer);
  };

  const { fee, totalFinal, totalWithFee, ratePercent } = useMemo(() => {
    const baseTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    if (!selectedPaymentMethod) return { fee: 0, totalFinal: baseTotal, totalWithFee: baseTotal, ratePercent: 0 };

    const rates = paymentRates[selectedPaymentMethod];
    if (!rates) return { fee: 0, totalFinal: baseTotal, totalWithFee: baseTotal, ratePercent: 0 };

    let currentRatePercent = 0;
    const numInstallments = parseInt(selectedInstallment, 10);

    if (selectedPaymentMethod === 'Crédito' && Array.isArray(rates)) {
        if (numInstallments > 0) {
            const installmentIndex = numInstallments - 1;
            currentRatePercent = parseFloat(rates[installmentIndex] || '0');
        }
    } else if (typeof rates === 'string') {
        currentRatePercent = parseFloat(rates);
    }
    
    if (isNaN(currentRatePercent)) currentRatePercent = 0;

    if (passFeeToCustomer && currentRatePercent > 0) {
        const newTotal = baseTotal / (1 - currentRatePercent / 100);
        const calculatedFee = newTotal - baseTotal;
        return { fee: calculatedFee, totalFinal: newTotal, totalWithFee: newTotal, ratePercent: currentRatePercent };
    } else {
        const calculatedFee = baseTotal * (currentRatePercent / 100);
        return { fee: calculatedFee, totalFinal: baseTotal, totalWithFee: baseTotal + calculatedFee, ratePercent: currentRatePercent };
    }
  }, [cartItems, selectedPaymentMethod, selectedInstallment, paymentRates, passFeeToCustomer]);
  
  const handlePrintReceipt = (sale: Sale) => {
    const receiptHtml = renderToString(<PrintableReceipt sale={sale} />);
    const printWindow = window.open('', '_blank', 'height=600,width=400');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Recibo</title>');
      printWindow.document.write('<style>');
      printWindow.document.write(`
        @import url('https://rsms.me/inter/inter.css');
        body { font-family: 'Inter', sans-serif; margin: 0; }
        .receipt-container { width: 302px; margin: auto; padding: 2rem; background: white; color: black; }
        .text-center { text-align: center; } .mb-4 { margin-bottom: 1rem; } .text-2xl { font-size: 1.5rem; }
        .font-bold { font-weight: 700; } .text-xs { font-size: 0.75rem; } .border-t { border-top-width: 1px; }
        .border-b { border-bottom-width: 1px; } .border-dashed { border-style: dashed; } .border-black { border-color: #000; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; } .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
        .font-semibold { font-weight: 600; } .text-sm { font-size: 0.875rem; }
        .space-y-1 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.25rem; } .flex { display: flex; }
        .justify-between { justify-content: space-between; } .mt-2 { margin-top: 0.5rem; } .pt-2 { padding-top: 0.5rem; }
        .w-full { width: 100%; } .text-left { text-align: left; } .text-right { text-align: right; }
        .pb-1 { padding-bottom: 0.25rem; } .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .align-top { vertical-align: top; } .space-y-1 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.25rem; }
        .text-base { font-size: 1rem; } .mt-6 { margin-top: 1.5rem; }
      `);
      printWindow.document.write('</style></head><body>');
      printWindow.document.write(`<div class="receipt-container">${receiptHtml}</div>`);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };


  const handleFinalizeSale = async () => {
    if (!selectedPaymentMethod || !selectedCustomer) {
      toast({
        variant: "destructive",
        title: "Informações Incompletas",
        description: "Por favor, selecione o cliente e o método de pagamento.",
      });
      return;
    }

    if (isProcessingSale) return; // Previne duplo clique

    setIsProcessingSale(true);

     const subtotal = cartItems.reduce(
        (acc, item) => acc + item.originalPrice * item.quantity,
        0
      );

    const saleToSave = {
      date: new Date().toISOString(),
      client: selectedCustomer.name,
      vendedor: currentCollaborator?.name || 'Proprietário',
      status: selectedPaymentMethod === 'Fiado' ? 'Pendente' : 'Concluída',
      payment: {
        method: selectedPaymentMethod,
        ...(selectedPaymentMethod === 'Crédito' && { installments: parseInt(selectedInstallment, 10) }),
      },
      items: cartItems.map(item => ({...item, id: String(item.id)})),
      subtotal: subtotal,
      fees: fee, // The actual cost fee, regardless of who pays it
      total: totalFinal, // The final amount paid by the customer
    } as Omit<Sale, 'id'>;
    
    try {
      await addSale(saleToSave);
      
      toast({
        title: "Venda Realizada!",
        description: `${selectedCustomer?.name || 'Cliente Avulso'} - ${formatCurrency(totalFinal)}`,
        action: (
          <ToastAction altText="Imprimir Recibo" onClick={() => handlePrintReceipt({...saleToSave, id: `VEN-${Date.now()}`} as Sale)}>
              <Printer className="mr-2"/> Imprimir Recibo
          </ToastAction>
        ),
      });

      handleClearCart();
      setIsCheckoutOpen(false);
      setSelectedPaymentMethod(null);
      setSelectedInstallment('1');
      const defaultCustomer = customers.find(c => c.email === 'consumidor@final.com');
      setSelectedCustomer(defaultCustomer || customers[0] || null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao finalizar venda",
        description: "Ocorreu um erro ao salvar a venda. Tente novamente.",
      });
    } finally {
      setIsProcessingSale(false);
    }
  }

  const subtotal = useMemo(() => cartItems.reduce(
    (acc, item) => acc + item.originalPrice * item.quantity,
    0
  ), [cartItems]);
  
  const totalDiscount = useMemo(() => cartItems.reduce(
    (acc, item) => acc + (item.originalPrice - item.price) * item.quantity,
    0
  ), [cartItems]);


  const filteredItems = useMemo(() => allItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [allItems, searchTerm]);


  return (
    <>
      <div className="grid flex-1 grid-cols-1 md:grid-cols-[1fr_400px] gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="hidden sm:inline">Ponto de Venda</span>
              <span className="sm:hidden">PDV</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar produtos ou serviços..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {filteredItems.length > 0 ? (
             <ItemList items={filteredItems} onAddItem={handleAddItem} />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-md">
                <p className="text-muted-foreground mb-4">Nenhum item encontrado para "{searchTerm}"</p>
                <Button onClick={handleOpenProductForm}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Novo Item
                </Button>
            </div>
          )}
        </div>
        <aside>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart />
                Pedido Atual
              </CardTitle>
              <CardDescription>
                Resumo dos itens adicionados ao pedido.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.length === 0 ? (
                <div className="flex justify-center items-center h-24 border-2 border-dashed rounded-md">
                  <p className="text-muted-foreground">O carrinho está vazio</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                  {cartItems.map((item) => {
                    return (
                    <div key={item.id} className="flex items-start gap-4">
                      <div className="w-16 h-16 flex items-center justify-center">
                        <ProductImage
                          imageUrl={item.imageUrl || ''}
                          name={item.name}
                          size={64}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-tight">{item.name}</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                            {item.price < item.originalPrice && (
                                <p className="text-xs text-muted-foreground line-through">{formatCurrency(item.originalPrice)}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          >
                            <MinusCircle className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-semibold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <PlusCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className='flex flex-col items-end gap-1'>
                         <p className="text-sm font-semibold">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleRemoveFromCart(item.id)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )})}
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Descontos</span>
                  <span>- {formatCurrency(totalDiscount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(subtotal - totalDiscount)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button className="w-full" disabled={cartItems.length === 0} onClick={() => setIsCheckoutOpen(true)}>
                Finalizar Venda
              </Button>
              <Button variant="outline" className="w-full" onClick={handleClearCart} disabled={cartItems.length === 0}>
                Cancelar Pedido
              </Button>
            </CardFooter>
          </Card>
        </aside>
      </div>

      <Dialog open={isVariationSelectorOpen} onOpenChange={setIsVariationSelectorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecione a Variação</DialogTitle>
            <DialogDescription>
              O produto "{itemForVariationSelection?.name}" possui múltiplas variações. Por favor, escolha uma.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2 py-4">
            {itemForVariationSelection?.variations?.map(variation => {
                const promotion = getApplicablePromotion(itemForVariationSelection!.id!);
                const originalPrice = variation.price;
                const finalPrice = promotion ? originalPrice * (1 - promotion.discount / 100) : originalPrice;

                return (
                    <Button
                        key={variation.name}
                        variant="outline"
                        className="w-full justify-between h-auto py-2"
                        onClick={() => handleSelectVariation(variation)}
                        disabled={variation.stock === 0}
                    >
                        <div className="text-left">
                        <p className="font-semibold">{variation.name}</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-sm font-medium">{formatCurrency(finalPrice)}</p>
                            {promotion && (
                                <p className="text-xs text-muted-foreground line-through">{formatCurrency(originalPrice)}</p>
                            )}
                        </div>
                        </div>
                        <Badge variant={variation.stock > 0 ? "secondary" : "destructive"}>
                        {variation.stock} em estoque
                        </Badge>
                    </Button>
                )
            })}
          </div>
          <DialogFooter>
             <Button type="button" variant="ghost" onClick={() => setIsVariationSelectorOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
            <DialogDescription>
              Selecione o cliente e a forma de pagamento para concluir a venda.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Cliente</Label>
                <Popover open={isCustomerComboboxOpen} onOpenChange={setIsCustomerComboboxOpen}>
                    <PopoverTrigger asChild>
                        <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isCustomerComboboxOpen}
                        className="w-full justify-between"
                        >
                        {selectedCustomer
                            ? customers.find((c) => c.email === selectedCustomer.email)?.name
                            : "Selecione um cliente..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput placeholder="Buscar cliente..." />
                            <CommandList>
                                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                <CommandGroup>
                                {customers.map((customer) => (
                                    <CommandItem
                                    key={customer.email}
                                    value={customer.name}
                                    onSelect={() => {
                                        setSelectedCustomer(customer);
                                        setIsCustomerComboboxOpen(false);
                                    }}
                                    >
                                    <Check
                                        className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedCustomer?.email === customer.email ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{customer.name}</span>
                                        <span className="text-xs text-muted-foreground">{customer.email}</span>
                                    </div>
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={() => setIsCustomerFormOpen(true)}>
                   <UserPlus className="mr-2 h-4 w-4"/>
                   Cadastrar novo cliente
                </Button>
            </div>
            
            <div className="space-y-2 bg-muted p-4 rounded-md">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>
                 <div className="flex justify-between text-destructive">
                  <span>Descontos</span>
                  <span>- {formatCurrency(totalDiscount)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">
                        {passFeeToCustomer ? 'Taxas (Acréscimo)' : 'Taxas (Custo Lojista)'}
                    </span>
                    <span>
                        {passFeeToCustomer ? `+ ${formatCurrency(fee)}` : `- ${formatCurrency(fee)}`}
                    </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                    <span className="font-medium text-lg">Total a Pagar:</span>
                    <span className="font-bold text-2xl text-primary">
                        {formatCurrency(totalFinal)}
                    </span>
                </div>
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <Button
                      key={method.value}
                      variant="outline"
                      className={cn(
                        "h-12 justify-start gap-3",
                        selectedPaymentMethod === method.value && "border-primary ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedPaymentMethod(method.value)}
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span>{method.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
            {selectedPaymentMethod === 'Crédito' && (
              <div className="space-y-2">
                <Label htmlFor="installments">Número de Parcelas</Label>
                <Select value={selectedInstallment} onValueChange={setSelectedInstallment}>
                  <SelectTrigger id="installments">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(12)].map((_, i) => {
                       const numInstallments = i + 1;
                       const installmentValue = totalFinal / numInstallments;
                       const creditRates = Array.isArray(paymentRates['Crédito']) ? paymentRates['Crédito'] : Array(12).fill('0');
                       
                       const currentRate = parseFloat(creditRates[i] || '0');
                       const rateText = currentRate > 0 ? `(${currentRate.toFixed(2)}% taxa)` : '(sem juros)';

                       return (
                          <SelectItem key={i + 1} value={`${i + 1}`}>
                            <div className="flex justify-between w-full">
                              <span>
                                {`${numInstallments}x de ${formatCurrency(installmentValue)}`}
                              </span>
                              <span className="text-xs text-muted-foreground ml-4">
                                {rateText}
                              </span>
                            </div>
                          </SelectItem>
                       )
                    })}
                  </SelectContent>
                </Select>
                {ratePercent > 0 && (
                    <div className="flex items-center space-x-2 pt-2">
                        <Switch
                            id="pass-fee"
                            checked={passFeeToCustomer}
                            onCheckedChange={setPassFeeToCustomer}
                        />
                        <Label htmlFor="pass-fee" className="text-sm">
                            Repassar taxa para o cliente
                        </Label>
                    </div>
                )}
                 <p className="text-xs text-muted-foreground">
                    O valor total a ser pago pelo cliente será {formatCurrency(totalFinal)}.
                 </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCheckoutOpen(false)}>Cancelar</Button>
            <Button 
              type="button" 
              onClick={handleFinalizeSale} 
              disabled={!selectedPaymentMethod || !selectedCustomer || isProcessingSale}
            >
              {isProcessingSale ? "Processando..." : "Confirmar Venda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CustomerFormDialog
        isOpen={isCustomerFormOpen}
        onOpenChange={setIsCustomerFormOpen}
        editingCustomer={null}
        onSave={handleSaveCustomer}
      />
      
      <ProductFormDialog
        isOpen={isProductFormOpen}
        onOpenChange={setIsProductFormOpen}
        onSubmit={handleSaveProduct}
        editingItem={null}
        itemType="product"
        categories={categories}
        handleOpenCategoryDialog={() => setIsCategoryFormOpen(true)}
       />

      <CategoryFormDialog
        isOpen={isCategoryFormOpen}
        onOpenChange={setIsCategoryFormOpen}
        onSave={handleSaveCategory}
      />
    </>
  );
}



    

    