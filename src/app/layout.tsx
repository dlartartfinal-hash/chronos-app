
import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { AppHeader } from '@/components/app-header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeInitializer } from '@/components/theme-initializer';
import { SellerModeProvider } from '@/context/seller-mode-context';
import { InventoryProvider } from '@/context/inventory-context';
import { SubscriptionProvider } from '@/context/subscription-context';
import { CustomerProvider } from '@/context/customer-context';
import { SalesProvider } from '@/context/sales-context';
import { UserProvider } from '@/context/user-context';
import { PromotionProvider } from '@/context/promotion-context';
import { Suspense } from 'react';
import { ReferralTracker } from '@/components/referral-tracker';

export const metadata: Metadata = {
  title: 'Gestão Chronos',
  description: 'Gerenciamento centralizado para o seu negócio.',
  icons: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <ThemeProvider
            attribute="class"
            defaultTheme="chronos-light"
            themes={['chronos-light', 'chronos-dark']}
            enableSystem={false}
            disableTransitionOnChange
          >
          <UserProvider>
            <ThemeInitializer />
            <Suspense fallback={null}>
              <ReferralTracker />
            </Suspense>
            <SellerModeProvider>
              <InventoryProvider>
                <SubscriptionProvider>
                  <CustomerProvider>
                    <SalesProvider>
                      <PromotionProvider>
                        <SidebarProvider>
                            {children}
                        </SidebarProvider>
                      </PromotionProvider>
                    </SalesProvider>
                  </CustomerProvider>
                </SubscriptionProvider>
              </InventoryProvider>
            </SellerModeProvider>
          </UserProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
