
'use client';

import Link from 'next/link';
import { LogOut, Store, UserCircle, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/dashboard/user-nav';
import { SidebarTrigger } from './ui/sidebar';
import { ModoVendedorDialog } from '@/components/dashboard/modo-vendedor-dialog';
import { useEffect, useState } from 'react';
import { useSellerMode } from '@/context/seller-mode-context';
import { SairModoVendedorDialog } from '@/components/dashboard/sair-modo-vendedor-dialog';
import { CustomLogo } from './ui/custom-logo';

export function AppHeader() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const { isSellerMode, currentCollaborator, exitSellerMode } = useSellerMode();

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return (
       <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-header pr-4 text-header-foreground md:pr-6"></header>
    );
  }

   if (pathname === '/' || pathname === '/login') {
    return null;
  }

  const isDashboard = pathname.startsWith('/dashboard') && !isSellerMode;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-header pl-4 pr-4 text-header-foreground md:pr-6">
      <div className="flex items-center gap-2">
        {isDashboard && <SidebarTrigger className="md:hidden" />}
        {!isSellerMode && (
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-inherit h-8">
            <CustomLogo />
          </Link>
        )}
         {isSellerMode && currentCollaborator && (
            <div className="flex items-center gap-2 font-semibold">
                <UserCircle className="h-6 w-6" />
                <span>{currentCollaborator.name}</span>
            </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {isSellerMode ? (
            <div className="flex items-center gap-2">
              <ModoVendedorDialog
                isSwitchMode={true}
                onOpenChange={(open) => {
                if(open) {
                    // Silently log out the current user to allow for a clean switch
                    exitSellerMode(true);
                }
              }}>
                <Button variant="outline">
                    <Users className="md:mr-2" />
                    <span className="hidden md:inline">Trocar Vendedor</span>
                </Button>
              </ModoVendedorDialog>
              <SairModoVendedorDialog>
                <Button>
                    <LogOut className="md:mr-2" />
                    <span className="hidden md:inline">Sair do Modo Vendedor</span>
                </Button>
              </SairModoVendedorDialog>
            </div>
        ) : isDashboard ? (
          <div className="flex items-center gap-4">
             <ModoVendedorDialog>
              <Button variant="ghost">
                <Store className="mr-2" />
                Modo Vendedor
              </Button>
             </ModoVendedorDialog>
            <div className="hidden md:block">
              <UserNav />
            </div>
          </div>
        ) : (
          <>
            <ModoVendedorDialog>
              <Button variant="ghost">
                <Store className="mr-2" />
                Modo Vendedor
              </Button>
            </ModoVendedorDialog>
            <Button asChild variant="ghost">
              <Link href="/">
                <LogOut className="mr-2" />
                Sair
              </Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
