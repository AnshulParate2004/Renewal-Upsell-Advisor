import React, { createContext, useContext, useState } from 'react';

export type RevenueType = 'ARR' | 'MRR';

interface RevenueContextType {
  revenueType: RevenueType;
  setRevenueType: (type: RevenueType) => void;
}

const RevenueContext = createContext<RevenueContextType | undefined>(undefined);

export function RevenueProvider({ children }: { children: React.ReactNode }) {
  const [revenueType, setRevenueType] = useState<RevenueType>('ARR');

  return (
    <RevenueContext.Provider value={{ revenueType, setRevenueType }}>
      {children}
    </RevenueContext.Provider>
  );
}

export function useRevenue() {
  const context = useContext(RevenueContext);
  if (context === undefined) {
    throw new Error('useRevenue must be used within a RevenueProvider');
  }
  return context;
}
