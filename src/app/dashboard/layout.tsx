
'use client';

import {
  Boxes,
  DollarSign,
  Gift,
  Home,
  Landmark,
  Settings,
  Store,
  Users,
  Briefcase,
  BarChart3,
  Gem,
  ArrowRightLeft,
  Wallet,
  Tag,
  Percent,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { UserNav } from '@/components/dashboard/user-nav';
import { useSellerMode } from '@/context/seller-mode-context';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { ModoVendedorDialog } from '@/components/dashboard/modo-vendedor-dialog';
import { useEffect, useState } from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { TrialGuard } from '@/components/trial-guard';
import { TourGuide, TourHelpButton } from '@/components/tour-guide';
import { AuthGuard } from '@/components/auth-guard';
import { SetupOwnerPinDialog } from '@/components/dashboard/setup-owner-pin-dialog';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isSellerMode, profileAuthenticated, ownerPin, setOwnerPin } = useSellerMode();
  const [isClient, setIsClient] = useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [showSetupPin, setShowSetupPin] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Check if owner PIN needs to be set up on first login
  useEffect(() => {
    if (isClient && profileAuthenticated && !ownerPin) {
      // Fetch owner PIN from database
      const checkOwnerPin = async () => {
        try {
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const data = await response.json();
            if (!data.user.ownerPin) {
              setShowSetupPin(true);
            } else {
              setOwnerPin(data.user.ownerPin);
            }
          }
        } catch (error) {
          console.error('Error checking owner PIN:', error);
        }
      };
      checkOwnerPin();
    }
  }, [isClient, profileAuthenticated, ownerPin, setOwnerPin]);
  
  const handlePinSetupComplete = (pin: string) => {
    setOwnerPin(pin);
    setShowSetupPin(false);
  };


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/dashboard/financas')) {
      setIsFinanceOpen(true);
    }
  }, [pathname]);

  const mainNavItems = [
    { href: '/dashboard', icon: Home, label: 'Painel', tooltip: 'Painel' },
    {
      href: '/dashboard/pdv',
      icon: Store,
      label: 'Ponto de Venda',
      tooltip: 'Ponto de Venda',
    },
    {
      href: '/dashboard/vendas',
      icon: DollarSign,
      label: 'Vendas',
      tooltip: 'Vendas',
    },
    {
      href: '/dashboard/produtos-servicos',
      icon: Boxes,
      label: 'Produtos/Serviços',
      tooltip: 'Produtos/Serviços',
    },
     {
      href: '/dashboard/promocoes',
      icon: Percent,
      label: 'Promoções',
      tooltip: 'Promoções',
    },
    {
      href: '/dashboard/categorias',
      icon: Tag,
      label: 'Categorias',
      tooltip: 'Categorias de Produtos',
    },
     {
      href: '/dashboard/relatorios',
      icon: BarChart3,
      label: 'Relatórios',
      tooltip: 'Relatórios',
    },
    {
      href: '/dashboard/clientes',
      icon: Users,
      label: 'Clientes',
      tooltip: 'Clientes',
    },
    {
      href: '/dashboard/colaboradores',
      icon: Briefcase,
      label: 'Colaboradores',
      tooltip: 'Colaboradores',
    },
    {
      href: '/dashboard/financas',
      icon: Landmark,
      label: 'Finanças',
      isCollapsible: true,
      subItems: [
        { href: '/dashboard/financas', icon: Wallet, label: 'Fluxo de Caixa' },
        { href: '/dashboard/financas/contas-a-receber', icon: ArrowRightLeft, label: 'Contas a Receber' },
      ]
    },
  ];
  
  const settingsNavItems = [
      { href: '/dashboard/assinatura', icon: Gem, label: 'Assinatura', tooltip: 'Assinatura' },
      { href: '/dashboard/indique-e-ganhe', icon: Gift, label: 'Indique e Ganhe', tooltip: 'Indique e Ganhe' },
      { href: '/dashboard/configuracoes', icon: Settings, label: 'Configurações', tooltip: 'Configurações' },
  ]


  if (isSellerMode && pathname !== '/dashboard/pdv') {
    // Force redirect to PDV if in seller mode and not on PDV page
     redirect('/dashboard/pdv');
  }
  
  if (isSellerMode) {
    return (
      <AuthGuard>
        <AppHeader />
        <main key={pathname} className="flex-1 overflow-auto space-y-4 p-4 pt-6 md:p-8 animate-fade-in-up">{children}</main>
      </AuthGuard>
    );
  }

  // On the client, check if a profile has been authenticated. If not, show the selection dialog.
  if (isClient && !profileAuthenticated) {
    return (
      <AuthGuard>
        <div className="flex h-screen w-screen items-center justify-center bg-background">
        <ModoVendedorDialog open={true} onOpenChange={(open) => {
          // If the dialog is closed without authentication, we don't grant access.
          // The `setProfileAuthenticated` in the dialog will handle access.
        }} isPage={true}>
          <span /> 
        </ModoVendedorDialog>
      </div>
      </AuthGuard>
    );
  }

  // Show a loading state or nothing on the server until client-side check is done.
  if (!isClient) {
    return null;
  }

  return (
    <AuthGuard>
      <TrialGuard>
        <AppHeader />
        <div className="flex flex-1">
        <Sidebar
          collapsible="none"
          className="border-r border-border bg-primary text-primary-foreground sticky top-16 h-[calc(100vh-4rem)]"
        >
          <div className="flex flex-col h-full p-2">
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  {item.isCollapsible ? (
                    <Collapsible open={isFinanceOpen} onOpenChange={setIsFinanceOpen}>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                                tooltip="Finanças"
                                className="justify-start w-full"
                                isActive={pathname.startsWith('/dashboard/financas')}
                            >
                                <Landmark />
                                <span>Finanças</span>
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenu>
                              {item.subItems?.map(subItem => (
                                <SidebarMenuItem key={subItem.label}>
                                    <SidebarMenuButton asChild isActive={pathname === subItem.href} variant="ghost" className="justify-start w-full">
                                        <Link href={subItem.href}>
                                            <subItem.icon />
                                            <span>{subItem.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                              ))}
                          </SidebarMenu>
                        </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton
                        asChild
                        tooltip={item.tooltip}
                        isActive={pathname === item.href}
                        className="justify-start"
                    >
                        <Link href={item.href!}>
                            <item.icon />
                            <span>{item.label}</span>
                        </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>

            <div className="mt-auto">
                <SidebarMenu>
                    {settingsNavItems.map((item) => (
                        <SidebarMenuItem key={item.label}>
                            <SidebarMenuButton
                                asChild
                                tooltip={item.tooltip}
                                isActive={pathname === item.href}
                                className="justify-start"
                            >
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
                 <div className="mt-2 flex justify-center p-2">
                    <UserNav />
                </div>
            </div>
          </div>
        </Sidebar>
        <main key={pathname} className="flex-1 overflow-auto space-y-4 p-4 pt-6 md:p-8 animate-fade-in-up">{children}</main>
        <TourGuide />
        <TourHelpButton />
        <SetupOwnerPinDialog open={showSetupPin} onComplete={handlePinSetupComplete} />
      </div>
      </TrialGuard>
    </AuthGuard>
  );
}
