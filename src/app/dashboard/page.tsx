
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { DollarSign, Package, Users, CreditCard } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useSales } from '@/context/sales-context';
import { useCustomer } from '@/context/customer-context';
import { useInventory } from '@/context/inventory-context';
import { formatCurrency } from '@/lib/utils';
import { subMonths, isWithinInterval } from 'date-fns';

export default function DashboardPage() {
  const { sales } = useSales();
  const { customers } = useCustomer();
  const { products } = useInventory();

  const {
    totalRevenue,
    totalRevenueLastMonth,
    newCustomers,
    newCustomersLastMonth,
    activeOrders,
    activeOrdersLastMonth,
    revenueByMonth
  } = useMemo(() => {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const twoMonthsAgo = subMonths(now, 2);

    let totalRevenue = 0;
    let totalRevenueLastMonth = 0;
    let newCustomers = 0;
    let newCustomersLastMonth = 0;
    let activeOrders = 0;
    let activeOrdersLastMonth = 0;
    
    // Contar clientes criados no último mês
    customers.forEach(customer => {
      // Cliente Avulso (id: cust-0) não conta como cliente novo
      if (customer.id === 'cust-0') return;
      
      const createdAt = new Date(customer.createdAt || new Date());
      
      if (isWithinInterval(createdAt, { start: lastMonth, end: now })) {
        newCustomers++;
      } else if (isWithinInterval(createdAt, { start: twoMonthsAgo, end: lastMonth })) {
        newCustomersLastMonth++;
      }
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueByMonth = monthNames.map(name => ({ name, total: 0 }));

    sales.forEach(sale => {
      const saleDate = new Date(sale.date);
      if (sale.status === 'Concluída') {
        const monthIndex = saleDate.getMonth();
        revenueByMonth[monthIndex].total += sale.total;
      }
      
      if (isWithinInterval(saleDate, { start: lastMonth, end: now })) {
        if (sale.status === 'Concluída') totalRevenue += sale.total;
        if (sale.status === 'Pendente') activeOrders++;
      } else if (isWithinInterval(saleDate, { start: twoMonthsAgo, end: lastMonth })) {
        if (sale.status === 'Concluída') totalRevenueLastMonth += sale.total;
        if (sale.status === 'Pendente') activeOrdersLastMonth++;
      }
    });

    return { totalRevenue, totalRevenueLastMonth, newCustomers, newCustomersLastMonth, activeOrders, activeOrdersLastMonth, revenueByMonth };
  }, [sales, customers]);

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? '+100%' : 'N/A';
    }
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const totalStock = useMemo(() => {
    return products.reduce((acc, product) => {
      if (product.hasVariations && product.variations) {
        return acc + product.variations.reduce((varAcc, v) => varAcc + v.stock, 0);
      }
      return acc + (product.stock || 0);
    }, 0);
  }, [products]);


  const summaryCards = [
    { title: "Receita Total", icon: DollarSign, value: formatCurrency(totalRevenue), change: `${getPercentageChange(totalRevenue, totalRevenueLastMonth)} em relação ao mês passado` },
    { title: "Novos Clientes", icon: Users, value: `+${newCustomers}`, change: `${getPercentageChange(newCustomers, newCustomersLastMonth)} em relação ao mês passado` },
    { title: "Itens em Estoque", icon: Package, value: totalStock.toLocaleString('pt-BR'), change: "-2% em relação ao mês passado" }, // Mocked change
    { title: "Pedidos Pendentes", icon: CreditCard, value: `+${activeOrders}`, change: `${getPercentageChange(activeOrders, activeOrdersLastMonth)} em relação ao mês passado` }
  ];


  return (
    <>
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Card 
          className="lg:col-span-4 animate-fade-in-up opacity-0"
          style={{ animationDelay: `400ms` }}
        >
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart data={revenueByMonth} />
          </CardContent>
        </Card>
        <Card 
          className="lg:col-span-3 animate-fade-in-up opacity-0"
          style={{ animationDelay: `500ms` }}
        >
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
            <CardDescription>
              As últimas 5 vendas concluídas este mês.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentSales sales={sales.filter(s => s.status === 'Concluída').slice(0, 5)} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
