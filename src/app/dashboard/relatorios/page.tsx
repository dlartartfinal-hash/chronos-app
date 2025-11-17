
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { SalesByCategoryChart } from '@/components/dashboard/sales-by-category-chart';
import { TopProductsChart } from '@/components/dashboard/top-products-chart';
import { SalesOverTimeChart } from '@/components/dashboard/sales-over-time-chart';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useSales } from '@/context/sales-context';
import { useInventory, Product, Service } from '@/context/inventory-context';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, subDays, differenceInDays } from 'date-fns';
import { formatCurrency } from '@/lib/utils';


export default function RelatoriosPage() {
  const { sales } = useSales();
  const { products, services } = useInventory();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const { 
    currentPeriodSales,
    previousPeriodSales
  } = useMemo(() => {
    const now = new Date();
    const from = dateRange?.from || subDays(now, 29);
    const to = dateRange?.to || now;
    
    const diff = differenceInDays(to, from);
    const previousPeriodFrom = subDays(from, diff + 1);
    const previousPeriodTo = subDays(to, diff + 1);

    const filterSalesByDate = (sales: any[], start: Date, end: Date) => {
        return sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return isWithinInterval(saleDate, { start, end });
        });
    }
    
    return {
        currentPeriodSales: filterSalesByDate(sales, from, to),
        previousPeriodSales: filterSalesByDate(sales, previousPeriodFrom, previousPeriodTo)
    }

  }, [sales, dateRange]);

  const {
    totalRevenue,
    totalSales,
    averageTicket,
    salesByCategory,
    topProducts,
    salesOverTimeData
  } = useMemo(() => {
    let totalRevenue = 0;
    const salesByCategory: Record<string, number> = {};
    const topProducts: Record<string, {name: string, total: number}> = {};
    const salesOverTime: Record<string, number> = {};

    currentPeriodSales.forEach(sale => {
      if (sale.status === 'Concluída') {
        totalRevenue += sale.total;
        
        const dateKey = new Date(sale.date).toLocaleDateString('pt-BR');
        salesOverTime[dateKey] = (salesOverTime[dateKey] || 0) + sale.total;

        sale.items.forEach(item => {
          const product = products.find(p => p.hasVariations ? p.variations?.some(v => v.sku === item.id) : p.sku === item.id);
          const category = product ? product.category : 'Serviços';
          
          salesByCategory[category] = (salesByCategory[category] || 0) + (item.price * item.quantity);
          topProducts[item.name] = {
            name: item.name,
            total: (topProducts[item.name]?.total || 0) + (item.price * item.quantity),
          };
        });
      }
    });

    const totalSales = currentPeriodSales.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    const salesByCategoryData = Object.entries(salesByCategory).map(([name, value]) => ({ name, value }));
    const topProductsData = Object.values(topProducts).sort((a, b) => b.total - a.total).slice(0, 7);
    const salesOverTimeData = Object.entries(salesOverTime).map(([date, total]) => ({ date, Receita: total }));

    return { totalRevenue, totalSales, averageTicket, salesByCategory: salesByCategoryData, topProducts: topProductsData, salesOverTimeData };
  }, [currentPeriodSales, products]);
  
  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? '+100%' : 'N/A';
    }
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const previousTotalRevenue = previousPeriodSales.filter(s => s.status === 'Concluída').reduce((acc, s) => acc + s.total, 0);
  const previousTotalSales = previousPeriodSales.length;

  const summaryCards = [
    { title: "Receita no Período", icon: DollarSign, value: formatCurrency(totalRevenue), change: `${getPercentageChange(totalRevenue, previousTotalRevenue)} em relação ao período anterior` },
    { title: "Total de Vendas", icon: ShoppingCart, value: `+${totalSales}`, change: `${getPercentageChange(totalSales, previousTotalSales)} em relação ao período anterior` },
    { title: "Ticket Médio", icon: TrendingUp, value: formatCurrency(averageTicket), change: "N/A" }, // Needs previous period avg ticket
    { title: "Novos Clientes", icon: Users, value: "+42", change: "+5% em relação ao período anterior" } // Mock data
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios Avançados</h1>
          <p className="text-muted-foreground">
            Analise o desempenho do seu negócio com mais detalhes.
          </p>
        </div>
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
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
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.change}
                </p>
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card 
          className="lg:col-span-3 animate-fade-in-up opacity-0"
          style={{ animationDelay: `400ms` }}
        >
          <CardHeader>
            <CardTitle>Desempenho de Vendas</CardTitle>
             <CardDescription>
              Receita diária no período selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SalesOverTimeChart data={salesOverTimeData} />
          </CardContent>
        </Card>
        <Card 
          className="lg:col-span-2 animate-fade-in-up opacity-0"
          style={{ animationDelay: `500ms` }}
        >
          <CardHeader>
            <CardTitle>Vendas por Categoria</CardTitle>
            <CardDescription>
              Distribuição da receita entre as categorias de produtos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SalesByCategoryChart data={salesByCategory} />
          </CardContent>
        </Card>
      </div>
      <Card 
        className="animate-fade-in-up opacity-0"
        style={{ animationDelay: `600ms` }}
      >
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
           <CardDescription>
              Ranking de produtos por receita gerada no período.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <TopProductsChart data={topProducts} />
        </CardContent>
      </Card>
    </div>
  );
}
