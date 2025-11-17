

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CustomLogo } from './ui/custom-logo';

export function LandingHeader() {
  return (
    <header className="pl-4 pr-4 lg:pr-6 h-16 flex items-center justify-between border-b">
      <Link href="/" className="flex items-center justify-center font-bold text-inherit h-8">
        <CustomLogo />
      </Link>
      <nav className="flex gap-4 sm:gap-6">
        <Button variant="ghost" asChild>
            <Link href="/login">
                Login
            </Link>
        </Button>
        <Button asChild>
            <Link href="/register">
                Registrar-se
            </Link>
        </Button>
      </nav>
    </header>
  );
}
