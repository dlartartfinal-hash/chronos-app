
'use client';

import { LandingHeader } from '@/components/landing-header';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main 
        className="bg-landing-background flex-1 relative bg-cover bg-center"
      >
        <div className="absolute inset-0 bg-black/50 -z-10" />
      </main>
    </div>
  );
}
