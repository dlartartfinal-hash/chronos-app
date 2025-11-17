
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useUser } from './user-context';

export type Collaborator = {
  id: string;
  name: string;
  pin: string;
  canModifyItems: boolean;
  avatarId: string;
};

interface SellerModeContextType {
  isSellerMode: boolean;
  profileAuthenticated: boolean;
  currentCollaborator: Collaborator | null;
  enterSellerMode: (collaborator: Collaborator) => void;
  exitSellerMode: (silent?: boolean) => void;
  setProfileAuthenticated: (isAuthenticated: boolean) => void;
  ownerPin: string;
  setOwnerPin: (pin: string) => void;
}

const SellerModeContext = createContext<SellerModeContextType | undefined>(undefined);

const getStorageKey = (userEmail: string, key: string) => `${userEmail}_${key}`;

const DEFAULT_OWNER_PIN = '1234';

export function SellerModeProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [isSellerMode, setIsSellerMode] = useState<boolean>(false);
  const [profileAuthenticated, setProfileAuthenticatedState] = useState<boolean>(false);
  const [currentCollaborator, setCurrentCollaborator] = useState<Collaborator | null>(null);
  const [ownerPin, setOwnerPinState] = useState<string>(DEFAULT_OWNER_PIN);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (user) {
      try {
        const sellerModeKey = getStorageKey(user.email, 'seller_mode_active');
        const collaboratorKey = getStorageKey(user.email, 'current_collaborator');
        const ownerPinKey = getStorageKey(user.email, 'owner_pin');
        const profileAuthKey = getStorageKey(user.email, 'profile_authenticated');

        const storedSellerMode = localStorage.getItem(sellerModeKey) === 'true';
        const storedCollaborator = localStorage.getItem(collaboratorKey);
        const storedOwnerPin = localStorage.getItem(ownerPinKey);
        const storedProfileAuth = sessionStorage.getItem(profileAuthKey) === 'true';

        if (storedProfileAuth) {
            setProfileAuthenticatedState(true);
        }
        
        if (storedSellerMode && storedCollaborator) {
          setIsSellerMode(true);
          setCurrentCollaborator(JSON.parse(storedCollaborator));
        }

        if (storedOwnerPin) {
          setOwnerPinState(storedOwnerPin);
        } else {
          localStorage.setItem(ownerPinKey, DEFAULT_OWNER_PIN);
        }

      } catch (error) {
        console.error("Failed to read from localStorage", error);
      }
      setIsInitialized(true);
    } else {
      setIsSellerMode(false);
      setCurrentCollaborator(null);
      setProfileAuthenticatedState(false);
      setIsInitialized(false);
    }
  }, [user]);

  const enterSellerMode = useCallback((collaborator: Collaborator) => {
    if (!user) return;
    try {
      const sellerModeKey = getStorageKey(user.email, 'seller_mode_active');
      const collaboratorKey = getStorageKey(user.email, 'current_collaborator');
      localStorage.setItem(sellerModeKey, 'true');
      localStorage.setItem(collaboratorKey, JSON.stringify(collaborator));
    } catch (error) {
        console.error("Failed to write to localStorage", error);
    }
    setIsSellerMode(true);
    setCurrentCollaborator(collaborator);
    setProfileAuthenticated(true);
  }, [user]);

  const setProfileAuthenticated = useCallback((isAuthenticated: boolean) => {
      if (!user) return;
      setProfileAuthenticatedState(isAuthenticated);
      try {
        const profileAuthKey = getStorageKey(user.email, 'profile_authenticated');
        if (isAuthenticated) {
            sessionStorage.setItem(profileAuthKey, 'true');
        } else {
            sessionStorage.removeItem(profileAuthKey);
        }
      } catch (error) {
        console.error("Failed to write to sessionStorage", error);
      }
  }, [user]);

  const exitSellerMode = useCallback((silent = false) => {
    if (!user) return;
    try {
      const sellerModeKey = getStorageKey(user.email, 'seller_mode_active');
      const collaboratorKey = getStorageKey(user.email, 'current_collaborator');
      localStorage.removeItem(sellerModeKey);
      localStorage.removeItem(collaboratorKey);
    } catch (error) {
        console.error("Failed to write to localStorage", error);
    }
    setIsSellerMode(false);
    setCurrentCollaborator(null);
    if (!silent) {
        setProfileAuthenticated(true); // After exiting seller mode, owner is authenticated.
    }
  }, [user]);
  
  const setOwnerPin = useCallback((pin: string) => {
    if (!user) return;
    try {
      const ownerPinKey = getStorageKey(user.email, 'owner_pin');
      localStorage.setItem(ownerPinKey, pin);
      setOwnerPinState(pin);
    } catch (error) {
      console.error("Failed to write to localStorage", error);
    }
  }, [user]);

  // When the user logs out, reset the authentication state
  useEffect(() => {
    if (!user) {
        setProfileAuthenticatedState(false);
    }
  }, [user]);

  const value = { isSellerMode, profileAuthenticated, currentCollaborator, enterSellerMode, exitSellerMode, setProfileAuthenticated, ownerPin, setOwnerPin };

  // Render children only after initialization to prevent hydration issues
  if (!isInitialized && user) {
    return null;
  }

  return (
    <SellerModeContext.Provider value={value}>
      {children}
    </SellerModeContext.Provider>
  );
}

export function useSellerMode() {
  const context = useContext(SellerModeContext);
  if (context === undefined) {
    throw new Error('useSellerMode must be used within a SellerModeProvider');
  }
  return context;
}
