import { create } from 'zustand';

// We'll dynamically import FingerprintJS only on the client side
let fpPromise: Promise<import('@fingerprintjs/fingerprintjs').Agent> | null = null;

interface VisitorState {
  visitorId: string | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  initializeVisitorId: () => Promise<string | null>;
}

/**
 * Simple hash function for creating consistent IDs from device information
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Creates a fallback visitor ID using a combination of device information and localStorage
 * Only runs on the client side
 */
function createFallbackVisitorId(): string {
  // Make sure we're on the client side
  if (typeof window === 'undefined') {
    return 'server-side-fallback';
  }
  
  try {
    // Try to get stored fallback ID first
    const storedFallbackId = localStorage.getItem('visitorFallbackId');
    if (storedFallbackId) {
      return storedFallbackId;
    }
    
    // If no stored ID, create one based on device info
    const screenInfo = `${window.screen.width}x${window.screen.height}`;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const platform = navigator.platform;
    const colorDepth = window.screen.colorDepth;
    const pixelRatio = window.devicePixelRatio;
    
    // Create a hash of these values
    const fallbackData = `${screenInfo}-${timeZone}-${language}-${platform}-${colorDepth}-${pixelRatio}`;
    const fallbackHash = hashString(fallbackData);
    const newFallbackId = `fallback-${fallbackHash}`;
    
    // Store it for future use
    localStorage.setItem('visitorFallbackId', newFallbackId);
    return newFallbackId;
  } catch (error) {
    console.error('Error creating fallback ID:', error);
    return `fallback-${Date.now()}`;
  }
}

export const useVisitorStore = create<VisitorState>((set, get) => ({
  visitorId: null,
  isLoading: false,
  error: null,
  initialized: false,
  
  initializeVisitorId: async () => {
    // Skip if we're not in a browser environment
    if (typeof window === 'undefined') {
      console.log('Skipping visitor ID initialization on server side');
      return null;
    }

    // If already initialized, return the current visitor ID
    if (get().initialized) {
      return get().visitorId;
    }
    
    // If currently loading, wait for it to complete
    if (get().isLoading) {
      // Poll for visitor ID to be available
      let attempts = 0;
      const maxAttempts = 10;
      while (attempts < maxAttempts) {
        if (get().initialized) {
          return get().visitorId;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      // If we've waited too long and still not initialized, continue with attempt
    }
    
    set({ isLoading: true });
    
    try {
      // Dynamically import FingerprintJS only on client side
      if (!fpPromise) {
        const FingerprintJS = (await import('@fingerprintjs/fingerprintjs')).default;
        fpPromise = FingerprintJS.load();
      }
      
      // Get the visitor identifier
      const fp = await fpPromise;
      const result = await fp.get();
      
      const visitorId = result.visitorId;
      
      // Store the visitor ID
      set({ 
        visitorId,
        isLoading: false,
        initialized: true
      });
      
      // Return the visitor ID
      return visitorId;
    } catch (error) {
      // Use combination approach for fallback
      const fallbackId = createFallbackVisitorId();
      
      console.error('Error getting visitor ID:', error);
      set({ 
        visitorId: fallbackId,
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
        initialized: true
      });
      
      // Log the fallback ID for debugging (remove in production)
      console.log('Using fallback visitor ID:', fallbackId);
      
      // Return the fallback ID
      return fallbackId;
    }
  }
}));
