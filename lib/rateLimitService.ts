import { useVisitorStore } from './visitorStore';

/**
 * Helper function to check rate limit with a specific visitor ID
 */
async function checkWithVisitorId(visitorId: string): Promise<{ allowed: boolean; resetsAt: number }> {
  try {
    // Call the rate limit API with GET to check without incrementing
    const response = await fetch(`/api/rate-limit?visitorId=${encodeURIComponent(visitorId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Rate limit check failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // Fail open if there's an error
    return { allowed: true, resetsAt: Date.now() + 24 * 60 * 60 * 1000 };
  }
}

/**
 * Helper function to increment rate limit with a specific visitor ID
 */
async function incrementWithVisitorId(visitorId: string): Promise<{ allowed: boolean; resetsAt: number }> {
  try {
    // Call the rate limit API with POST to increment
    const response = await fetch('/api/rate-limit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId }),
    });
    
    if (!response.ok) {
      throw new Error(`Rate limit increment failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error incrementing rate limit:', error);
    // Fail open if there's an error
    return { allowed: true, resetsAt: Date.now() + 24 * 60 * 60 * 1000 };
  }
}

/**
 * Checks if a user has hit their rate limit without incrementing the counter
 * @returns Promise with rate limit status and reset time
 */
export const checkRateLimit = async (): Promise<{ allowed: boolean; resetsAt: number }> => {
  // Get the visitor store
  const visitorStore = useVisitorStore.getState();
  
  // Get or initialize the visitor ID
  let visitorId = visitorStore.visitorId;
  
  // If not initialized or no visitor ID, initialize and get the ID directly
  if (!visitorStore.initialized || !visitorId) {
    // This now returns the visitor ID directly
    visitorId = await visitorStore.initializeVisitorId();
    
    // If still no visitor ID after initialization, allow the request (fail open)
    if (!visitorId) {
      console.error('Failed to get visitor ID for rate limiting after initialization');
      return { allowed: true, resetsAt: Date.now() + 24 * 60 * 60 * 1000 };
    }
    
    // Use the visitor ID returned from initialization
    return checkWithVisitorId(visitorId);
  }
  
  // Double-check we have a visitor ID
  if (!visitorId) {
    console.error('Failed to get visitor ID for rate limiting');
    return { allowed: true, resetsAt: Date.now() + 24 * 60 * 60 * 1000 };
  }
  
  // We've already checked that visitorId is not null above
  return checkWithVisitorId(visitorId!);
};

/**
 * Increments the rate limit counter
 * @returns Promise with rate limit status and reset time
 */
export const incrementRateLimit = async (): Promise<{ allowed: boolean; resetsAt: number }> => {
  // Get the visitor store
  const visitorStore = useVisitorStore.getState();
  
  // Get or initialize the visitor ID
  let visitorId = visitorStore.visitorId;
  
  // If not initialized or no visitor ID, initialize and get the ID directly
  if (!visitorStore.initialized || !visitorId) {
    // This now returns the visitor ID directly
    visitorId = await visitorStore.initializeVisitorId();
    
    // If still no visitor ID after initialization, allow the request (fail open)
    if (!visitorId) {
      console.error('Failed to get visitor ID for rate limiting after initialization');
      return { allowed: true, resetsAt: Date.now() + 24 * 60 * 60 * 1000 };
    }
    
    // Use the visitor ID returned from initialization
    return incrementWithVisitorId(visitorId);
  }
  
  // Double-check we have a visitor ID
  if (!visitorId) {
    console.error('Failed to get visitor ID for rate limiting');
    return { allowed: true, resetsAt: Date.now() + 24 * 60 * 60 * 1000 };
  }
  
  // We've already checked that visitorId is not null above
  return incrementWithVisitorId(visitorId!);
};
