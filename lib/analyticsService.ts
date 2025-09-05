import { useVisitorStore } from './visitorStore';
import { Redis } from '@upstash/redis';

// Initialize Redis client
let redis: Redis | undefined;
if (
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL &&
  process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN
) {
  redis = new Redis({
    url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL,
    token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  console.warn('Upstash credentials not found. Analytics disabled.');
}

/**
 * Logs an event to analytics, ensuring the visitor ID is initialized first
 * @param eventName The name of the event to track
 * @returns Promise that resolves when the event is logged
 */
export const logAnalyticsEvent = async (eventName: string): Promise<void> => {
  if (!redis) {
    console.warn('Redis Client is not initialized!');
    return;
  }
  
  // Get the visitor store
  const visitorStore = useVisitorStore.getState();
  
  // If not initialized, initialize first
  if (!visitorStore.initialized) {
    await visitorStore.initializeVisitorId();
  }
  
  // If still no visitor ID after initialization, log error and return
  if (!visitorStore.visitorId) {
    console.error('Failed to get visitor ID for analytics');
    return;
  }
  
  const visitorId = visitorStore.visitorId;
  
  try {
    // Get the current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Fire-and-forget promise. We don't await it so it doesn't block UI.
    redis.incr(`analytics:olympiad_tutor:${eventName}`);
    
    // Also track daily stats
    redis.incr(`analytics:olympiad_tutor:daily:${today}:${eventName}`);
    
    // Increment event counter for this specific visitor
    redis.incr(`analytics:olympiad_tutor:visitor:${visitorId}:${eventName}`);
    
    // Add this visitor to a set of visitors who triggered this event
    redis.sadd(`analytics:olympiad_tutor:${eventName}:visitors`, visitorId);
    
    // Add to daily visitors set
    redis.sadd(`analytics:olympiad_tutor:daily:${today}:visitors`, visitorId);
    
    // Store the timestamp of this event for the visitor
    const timestamp = Date.now();
    redis.zadd(`analytics:olympiad_tutor:visitor:${visitorId}:timeline`, { 
      score: timestamp, 
      member: `${eventName}:${timestamp}` 
    });
    
    console.log(`Logged event '${eventName}' for visitor ${visitorId}`);
  } catch (error) {
    // Log errors to console but don't let analytics failure block the user.
    console.error(`Failed to log analytics event '${eventName}':`, error);
  }
};
