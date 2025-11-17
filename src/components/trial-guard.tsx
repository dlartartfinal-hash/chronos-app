'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/context/user-context';

export function TrialGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const [isChecking, setIsChecking] = useState(true);
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    async function checkTrialStatus() {
      // Don't check on subscription page
      if (pathname === '/dashboard/assinatura' || pathname === '/dashboard/assinatura/sucesso') {
        setCanAccess(true);
        setIsChecking(false);
        return;
      }

      // If no user, redirect to login
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // Fetch user data including trial and subscription info
        const response = await fetch('/api/user', {
          headers: {
            'x-user-email': user.email,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();

        // Check if user has active subscription
        const hasActiveSubscription = userData.subscription?.status === 'active';

        if (hasActiveSubscription) {
          setCanAccess(true);
          setIsChecking(false);
          return;
        }

        // Check if trial has expired
        if (userData.trialEndsAt) {
          const now = new Date();
          const trialEndsAt = new Date(userData.trialEndsAt);
          const trialExpired = now > trialEndsAt;

          if (trialExpired) {
            // Trial expired and no active subscription - redirect to subscription page
            router.push('/dashboard/assinatura');
            return;
          }
        }

        // Trial still active or no trial set - allow access
        setCanAccess(true);
        setIsChecking(false);
      } catch (error) {
        console.error('Error checking trial status:', error);
        // On error, allow access to avoid blocking users
        setCanAccess(true);
        setIsChecking(false);
      }
    }

    checkTrialStatus();
  }, [user, router, pathname]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Only render children if access is allowed
  return canAccess ? <>{children}</> : null;
}
