/**
 * useSidebarCollapse Hook
 * Manages sidebar collapse state with localStorage persistence
 * Validates Requirement 4.7
 */

'use client';

import { useState, useEffect } from 'react';

const SIDEBAR_COLLAPSE_KEY = 'admin-sidebar-collapsed';

/**
 * Hook to manage sidebar collapse state with localStorage persistence
 * 
 * @returns [collapsed, setCollapsed] - Current collapse state and setter function
 */
export function useSidebarCollapse(): [boolean, (collapsed: boolean) => void] {
  const [collapsed, setCollapsedState] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);

  // Initialize from localStorage on client side
  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
      if (stored !== null) {
        setCollapsedState(stored === 'true');
      }
    }
  }, []);

  // Persist to localStorage when state changes
  const setCollapsed = (value: boolean) => {
    setCollapsedState(value);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(value));
    }
  };

  // Return default state until client-side hydration is complete
  return [isClient ? collapsed : false, setCollapsed];
}
