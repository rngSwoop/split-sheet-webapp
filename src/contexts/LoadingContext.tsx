// Global loading state manager
'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  message: string;
  setLoading: (loading: boolean, message?: string) => void;
  ensureLoading: (message?: string) => void;
  clearLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Loading...');

  const setLoading = useCallback((loading: boolean, msg = 'Loading...') => {
    setIsLoading(loading);
    setMessage(msg);
  }, []);

  const ensureLoading = useCallback((msg = 'Loading...') => {
    setIsLoading(prevLoading => {
      const newLoading = true;
      if (!prevLoading) {
        setMessage(msg);
      }
      return newLoading;
    });
    
    // Update message if different (using functional update to avoid dependency issues)
    setMessage(prevMessage => {
      if (prevMessage !== msg && msg !== 'Loading Dashboard') {
        return msg;
      }
      return prevMessage;
    });
  }, []);

  const clearLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const contextValue = useMemo(() => ({
    isLoading,
    message,
    setLoading,
    ensureLoading,
    clearLoading,
  }), [isLoading, message, setLoading, ensureLoading, clearLoading]);

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}