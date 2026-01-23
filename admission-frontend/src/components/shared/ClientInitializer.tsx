'use client';

import { useEffect } from 'react';
import { initializeApiClient } from '@/lib/api-client';
import { initializeAuthStore } from '@/store/authStore';

/**
 * Client-side initializer component
 * Runs initialization code that requires browser APIs
 */
export function ClientInitializer() {
  useEffect(() => {
    // Initialize API client with configuration
    initializeApiClient();
    
    // Initialize auth store (restore token to cookie if needed)
    initializeAuthStore();
  }, []);

  return null;
}
