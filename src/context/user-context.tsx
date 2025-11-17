
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

type User = {
  name: string;
  email: string;
};

interface UserContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_KEY = 'app_user';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to read user from localStorage", error);
    }
    setIsInitialized(true);
  }, []);

  const login = useCallback((user: User) => {
    try {
      // Clear ALL localStorage data to remove old app data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        // Keep only the user key
        if (key !== USER_KEY) {
          localStorage.removeItem(key);
        }
      });
      
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setUser(user);
    } catch (error) {
      console.error("Failed to save user to localStorage", error);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      const userEmail = user?.email;
      if(userEmail) {
        Object.keys(localStorage).forEach(key => {
            if(key.startsWith(userEmail)) {
                localStorage.removeItem(key);
            }
        });
        // Clear sessionStorage too
        Object.keys(sessionStorage).forEach(key => {
            if(key.startsWith(userEmail)) {
                sessionStorage.removeItem(key);
            }
        });
      }
      localStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error("Failed to clear user data from localStorage", error);
    }
    setUser(null);
  }, [user]);

  const value = { user, login, logout };

  // This ensures that we don't render children until the user state is determined
  // from localStorage, preventing hydration mismatches and flashes of incorrect UI.
  if (!isInitialized) {
    return null; // Or return a global loading spinner
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
