import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface RateLimitBannerProps {
  resetsAt: number;
}

export function RateLimitBanner({ resetsAt }: RateLimitBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = Date.now();
      const resetDate = new Date(resetsAt);
      
      if (now >= resetsAt) {
        setTimeRemaining('now');
        return;
      }
      
      const resetTimeString = formatDate(resetDate);
      setTimeRemaining(resetTimeString);
    };
    
    // Update immediately
    updateTimeRemaining();
    
    // Update every minute
    const interval = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, [resetsAt]);
  
  return (
    <div className="p-4 border border-black border-2 mb-4 shadow-md">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>
        <div className="ml-3">
          <h3 className="text-base font-bold text-amber-800">
            Rate Limit Reached
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              You&apos;ve reached the daily limit. This limit helps us maintain service quality for all users.
            </p>
            <p className="mt-2 font-medium">
              Your limit will reset at: <strong className="text-amber-900">{timeRemaining}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
