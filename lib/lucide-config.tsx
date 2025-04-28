"use client";

import { LucideProps } from 'lucide-react';
import { createContext, useContext, useEffect, useState } from 'react';

// Create a context to provide the client-side only state
type LucideContextType = {
  isMounted: boolean;
};

const LucideContext = createContext<LucideContextType>({
  isMounted: false,
});

// Provider component
export function LucideProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <LucideContext.Provider value={{ isMounted }}>
      {children}
    </LucideContext.Provider>
  );
}

// Custom hook to use the context
export function useLucideContext() {
  return useContext(LucideContext);
}

// Custom icon wrapper to prevent hydration issues
export function SafeLucideIcon({
  icon: Icon,
  ...props
}: LucideProps & { icon: React.ComponentType<LucideProps> }) {
  const { isMounted } = useLucideContext();

  if (!isMounted) {
    // Return a placeholder during SSR
    return (
      <div 
        className={`inline-block ${props.className || ''}`} 
        style={{ 
          width: props.size || '1em', 
          height: props.size || '1em' 
        }} 
      />
    );
  }

  return <Icon {...props} />;
}
