'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface TabState {
  [key: string]: {
    activeTab: string;
    data?: any;
  };
}

interface TabContextType {
  tabState: TabState;
  setActiveTab: (page: string, tab: string) => void;
  getActiveTab: (page: string) => string;
  setTabData: (page: string, data: any) => void;
  getTabData: (page: string) => any;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const useTabContext = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
};

export function TabProvider({ children }: { children: ReactNode }) {
  const [tabState, setTabState] = useState<TabState>({});

  const setActiveTab = useCallback((page: string, tab: string) => {
    setTabState(prev => ({
      ...prev,
      [page]: {
        ...prev[page],
        activeTab: tab,
      },
    }));
  }, []);

  const getActiveTab = useCallback((page: string) => {
    return tabState[page]?.activeTab || '';
  }, [tabState]);

  const setTabData = useCallback((page: string, data: any) => {
    setTabState(prev => ({
      ...prev,
      [page]: {
        ...prev[page],
        data,
      },
    }));
  }, []);

  const getTabData = useCallback((page: string) => {
    return tabState[page]?.data || null;
  }, [tabState]);

  return (
    <TabContext.Provider value={{ tabState, setActiveTab, getActiveTab, setTabData, getTabData }}>
      {children}
    </TabContext.Provider>
  );
}
