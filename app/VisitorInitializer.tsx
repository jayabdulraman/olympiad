'use client';

import { useEffect } from 'react';
import { useVisitorStore } from '@/lib/visitorStore';

/**
 * Component that initializes the visitor ID as early as possible
 */
export function VisitorInitializer() {
  useEffect(() => {
    // Initialize visitor ID as early as possible
    const initVisitor = async () => {
      try {
        await useVisitorStore.getState().initializeVisitorId();
        console.log('Visitor ID initialized on app load');
      } catch (error) {
        console.error('Failed to initialize visitor ID:', error);
      }
    };
    
    initVisitor();
  }, []);
  
  // This component doesn't render anything
  return null;
}
