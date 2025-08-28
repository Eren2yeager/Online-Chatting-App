'use client';

import { createContext, useContext, useState } from 'react';

const NavigationContext = createContext();

export function NavigationProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <NavigationContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
