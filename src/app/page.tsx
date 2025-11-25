
'use client';

import { LandingHeader } from '@/components/landing-header';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main 
        className="bg-landing-background flex-1 relative bg-cover bg-center flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-black/50 -z-10" />
        <div className="relative text-center text-white px-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">
            Uma nova era chegou
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl opacity-90">
            Faça parte da Chronos
          </p>
        </div>
      </main>
    </div>
  );
}
