'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useUser } from './user-context';

interface TourContextType {
  isTourActive: boolean;
  currentStep: number;
  startTour: () => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  resetTour: () => void;
  completeTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const TOUR_KEY = 'chronos_tour_completed';

export function TourProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (user) {
      const tourCompleted = localStorage.getItem(`${TOUR_KEY}_${user.email}`);
      // Auto-start tour for new users
      if (!tourCompleted) {
        // Give a small delay to let the UI render
        setTimeout(() => setIsTourActive(true), 1000);
      }
    }
  }, [user]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsTourActive(true);
  }, []);

  const stopTour = useCallback(() => {
    setIsTourActive(false);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const resetTour = useCallback(() => {
    if (user) {
      localStorage.removeItem(`${TOUR_KEY}_${user.email}`);
      startTour();
    }
  }, [user, startTour]);

  const completeTour = useCallback(() => {
    if (user) {
      localStorage.setItem(`${TOUR_KEY}_${user.email}`, 'true');
    }
    stopTour();
  }, [user, stopTour]);

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        currentStep,
        startTour,
        stopTour,
        nextStep,
        prevStep,
        resetTour,
        completeTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
