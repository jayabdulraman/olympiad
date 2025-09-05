import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Initialize an agent at application startup
const fpPromise = FingerprintJS.load();

export async function getVisitorId(): Promise<string> {
  try {
    // Get the visitor identifier
    const fp = await fpPromise;
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error('Error getting visitor ID:', error);
    // Fallback to a random ID if fingerprinting fails
    return `fallback-${Math.random().toString(36).substring(2, 15)}`;
  }
}

// React hook for using visitor ID
export function useVisitorId() {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisitorId = async () => {
      try {
        const id = await getVisitorId();
        setVisitorId(id);
      } catch (error) {
        console.error('Failed to get visitor ID:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisitorId();
  }, []);

  return { visitorId, loading };
}
