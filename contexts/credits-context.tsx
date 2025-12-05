'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface CreditsContextType {
  credits: number;
  updateCredits: (newCredits: number) => void;
  addCredits: (amount: number) => void;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({
  children,
  initialCredits,
}: {
  children: ReactNode;
  initialCredits: number;
}) {
  const [credits, setCredits] = useState(initialCredits);

  const updateCredits = (newCredits: number) => {
    setCredits(newCredits);
  };

  const addCredits = (amount: number) => {
    setCredits((prev) => prev + amount);
  };

  return (
    <CreditsContext.Provider value={{ credits, updateCredits, addCredits }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
}
