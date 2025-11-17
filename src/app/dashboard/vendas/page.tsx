

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  ReceiptText,
  X,
  Printer,
  Mail,
  User,
  ShoppingBag,
  CircleUser,
  Search,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { paymentMethods } from '@/lib/payment-methods';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { DateRange } from 'react-day-picker';
import { renderToString } from 'react-dom/server';
import { PrintableReceipt } from '@/components/dashboard/printable-receipt';
import { useSales, Sale, formatPaymentMethod } from '@/context/sales-context';
import { formatCurrency } from '@/lib/utils';


const paymentMethodIcons = paymentMethods.reduce((acc, method) => {
  acc[method.value] = method.icon;
  return acc;
}, {} as { [key: string]: React.ElementType });


const getBadgeVariantForStatus = (status: string) => {
  switch (status) {
    case 'Concluída':
      return 'default';
    case 'Pendente':
      return 'secondary';
    case 'Cancelada':
      return 'destructive';
    default:
      return 'outline';
  }
};


export default function VendasPage() {
  const { sales } = useSales();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sellerFilter, setSellerFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  
  const sellers = useMemo(() => [...new Set(sales.map(sale => sale.vendedor))], [sales]);

  const filteredSales = useMemo(() => {
    return sales
      .filter((sale) => {
        if (statusFilter === 'all') return true;
        return sale.status === statusFilter;
      })
      .filter((sale) => {
        if (sellerFilter === 'all') return true;
        return sale.vendedor === sellerFilter;
      })
      .filter((sale) => {
        if (searchTerm === '') return true;
        const term = searchTerm.toLowerCase();
        return (
          sale.id.toLowerCase().includes(term) ||
          sale.client.toLowerCase().includes(term)
        );
      })
      .filter((sale) => {
        if (!dateRange?.from) return true;
        const saleDate = new Date(sale.date);
        saleDate.setUTCHours(0, 0, 0, 0); // Normalize sale date
        
        const fromDate = new Date(dateRange.from);
        fromDate.setUTCHours(0, 0, 0, 0); // Normalize from date

        if (dateRange.to) {
            const toDate = new Date(dateRange.to);
            toDate.setUTCHours(0,0,0,0); // Normalize to date
            return saleDate >= fromDate && saleDate <= toDate;
        }
        return saleDate.getTime() === fromDate.getTime();
      });
  }, [sales, searchTerm, statusFilter, sellerFilter, dateRange]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSellerFilter('all');
    setDateRange({ from: undefined, to: undefined });
  };
  
  const handlePrint = () => {
    if (!selectedSale) return;

    const receiptHtml = renderToString(<PrintableReceipt sale={selectedSale} />);

    const printWindow = window.open('', '_blank', 'height=600,width=400');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Recibo</title>');
      // A better approach would be to link to a stylesheet
      printWindow.document.write('<style>');
      printWindow.document.write(`
        @import url('https://rsms.me/inter/inter.css');
        body { font-family: 'Inter', sans-serif; margin: 0; }
        .receipt-container { width: 302px; margin: auto; padding: 2rem; background: white; color: black; }
        .text-center { text-align: center; }
        .mb-4 { margin-bottom: 1rem; }
        .text-2xl { font-size: 1.5rem; }
        .font-bold { font-weight: 700; }
        .text-xs { font-size: 0.75rem; }
        .border-t { border-top-width: 1px; }
        .border-b { border-bottom-width: 1px; }
        .border-dashed { border-style: dashed; }
        .border-black { border-color: #000; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
        .font-semibold { font-weight: 600; }
        .text-sm { font-size: 0.875rem; }
        .space-y-1 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.25rem; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .mt-2 { margin-top: 0.5rem; }
        .pt-2 { padding-top: 0.5rem; }
        .w-full { width: 100%; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .pb-1 { padding-bottom: 0.25rem; }
        .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .align-top { vertical-align: top; }
        .space-y-1 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.25rem; }
        .text-base { font-size: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
      `);
      printWindow.document.write('</style></head><body>');
      printWindow.document.write(`<div class="receipt-container">${receiptHtml}</div>`);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      // Use a timeout to ensure content is loaded before printing
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Histórico de Vendas</h1>
          <p className="text-muted-foreground">
            Pesquise e filtre a lista de todas as vendas registradas.
          </p>
        </div>
        
        <Card>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Pesquisar por código ou cliente..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sellerFilter} onValueChange={setSellerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Vendedores</SelectItem>
                  {sellers.map(seller => (
                    <SelectItem key={seller} value={seller}>{seller}</SelectItem>
                  ))}
                </SelectContent>
            </Select>
            <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
              <DateRangePicker 
                date={dateRange}
                onDateChange={setDateRange}
                className="w-full"
              />
              <Button variant="outline" onClick={clearFilters} className="h-10">
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {filteredSales.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredSales.map((sale, index) => {
                const Icon = paymentMethodIcons[sale.payment.method] || DollarSign;
                return (
                  <Card 
                    key={sale.id} 
                    onClick={() => setSelectedSale(sale)} 
                    className="cursor-pointer hover:border-primary transition-colors flex flex-col animate-fade-in-up opacity-0"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader>
                      <CardTitle className="flex justify-between items-start">
                        <span className="font-semibold">{sale.id}</span>
                         <Badge variant={getBadgeVariantForStatus(sale.status)}>
                          {sale.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {new Date(sale.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{sale.client}</span>
                      </div>
                       <div className="flex items-center gap-2">
                        <CircleUser className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{sale.vendedor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatPaymentMethod(sale.payment)}</span>
                      </div>
                    </CardContent>
                    <CardContent>
                       <Separator />
                    </CardContent>
                    <CardContent className="flex justify-between items-center">
                      <span className="text-base font-bold">Total</span>
                      <span className="text-2xl font-bold text-card-foreground">{formatCurrency(sale.total)}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-md">
              <p className="text-muted-foreground mb-2">Nenhuma venda encontrada para os filtros aplicados.</p>
               <p className="text-sm text-muted-foreground">Tente ajustar sua pesquisa ou limpar os filtros.</p>
          </div>
        )}
        
        <Sheet open={!!selectedSale} onOpenChange={(isOpen) => !isOpen && setSelectedSale(null)}>
          <SheetContent className="sm:max-w-lg">
            {selectedSale && (
              <>
                <SheetHeader className="mb-6">
                  <SheetTitle className="flex items-center gap-2">
                    <ReceiptText />
                    Detalhes da Venda
                  </SheetTitle>
                  <SheetDescription>
                    <span className="font-semibold">{selectedSale.id}</span>
                    {' - '}
                    {new Date(selectedSale.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <div className="space-y-1">
                          <h4 className="font-semibold">Cliente</h4>
                          <p className="text-muted-foreground">{selectedSale.client}</p>
                      </div>
                      <div className="space-y-1 text-right">
                          <h4 className="font-semibold">Vendedor</h4>
                          <p className="text-muted-foreground">{selectedSale.vendedor}</p>
                      </div>
                   </div>
                   
                   <Separator />

                   <div className="space-y-2">
                     <h4 className="font-semibold">Itens Vendidos</h4>
                     <div className="space-y-3">
                       {selectedSale.items.map(item => {
                         return (
                           <div key={item.id} className="flex items-center gap-4">
                              <div className="relative w-16 h-16 aspect-square rounded-md overflow-hidden">
                                <Image
                                  alt={item.name}
                                  src={item.imageUrl || "/placeholder.svg"}
                                  fill
                                  className="object-cover"
                                  data-ai-hint={'product'}
                                />
                              </div>
                             <div className="flex-1">
                               <p className="font-medium">{item.name}</p>
                               <p className="text-sm text-muted-foreground">
                                 {item.quantity} x {formatCurrency(item.price)}
                               </p>
                             </div>
                             <p className="font-medium">{formatCurrency(item.quantity * item.price)}</p>
                           </div>
                         )
                       })}
                     </div>
                   </div>

                   <Separator />

                   <div className="space-y-2">
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Subtotal</span>
                       <span>{formatCurrency(selectedSale.subtotal)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Taxas</span>
                       <span>{formatCurrency(selectedSale.fees)}</span>
                     </div>
                      <div className="flex justify-between font-bold text-lg">
                       <span>Total</span>
                       <span>{formatCurrency(selectedSale.total)}</span>
                     </div>
                   </div>

                   <Separator />
                   
                   <div className="space-y-1">
                      <h4 className="font-semibold">Pagamento</h4>
                      <div className="flex items-center justify-between text-muted-foreground">
                         <div className="flex items-center gap-2">
                            {React.createElement(paymentMethodIcons[selectedSale.payment.method] || DollarSign, { className: 'h-4 w-4' })}
                           <span>{formatPaymentMethod(selectedSale.payment)}</span>
                         </div>
                         <Badge variant={getBadgeVariantForStatus(selectedSale.status)}>
                          {selectedSale.status}
                        </Badge>
                      </div>
                   </div>
                </div>
                <SheetFooter className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir Recibo
                    </Button>
                    <Button>
                       <Mail className="mr-2 h-4 w-4" />
                      Enviar por E-mail
                    </Button>
                </SheetFooter>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
