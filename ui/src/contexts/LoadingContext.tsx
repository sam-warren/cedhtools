import React, { createContext, ReactNode, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { ILoadingContext } from 'src/types';

const LoadingContext = createContext<ILoadingContext | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [loading, setLoadingInternal] = useState<boolean>(false);
  const timeoutRef = useRef<number>();

  const setLoading: React.Dispatch<React.SetStateAction<boolean>> = useCallback((value) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    // Handle both immediate boolean and function updates
    const isLoading = typeof value === 'function' ? value(loading) : value;

    if (isLoading) {
      setLoadingInternal(true);
    } else {
      // Add a small delay before hiding the loader
      timeoutRef.current = window.setTimeout(() => {
        setLoadingInternal(false);
      }, 150); // Small delay to prevent flashing
    }
  }, [loading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): ILoadingContext => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};