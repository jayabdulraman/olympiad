import { useState } from 'react';
import { BarChart, LoaderCircle } from 'lucide-react';

interface AnalyticsData {
  totalProblems: number;
  totalFollowUps: number;
  totalQuizzes: number;
  uniqueVisitors: number;
  rateLimit: number;
}

interface AnalyticsDashboardProps {
  isAdmin?: boolean;
  adminKey?: string;
}

export function AnalyticsDashboard({ isAdmin = false, adminKey }: AnalyticsDashboardProps) {
  const [showDashboard, setShowDashboard] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!adminKey) {
      setError('Admin key is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/analytics?adminKey=${adminKey}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }
      
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError((error as Error).message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => {
          setShowDashboard(!showDashboard);
          if (!showDashboard && !data && !error) fetchAnalytics();
        }}
        className="p-2 bg-black text-white rounded-full shadow-lg hover:bg-gray-800"
        aria-label="Toggle analytics dashboard"
      >
        <BarChart className="w-5 h-5" />
      </button>

      {showDashboard && (
        <div className="absolute top-12 right-0 bg-white p-4 rounded-lg shadow-xl border border-gray-200 w-80">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold">Analytics Dashboard</h3>
            <button 
              onClick={() => setShowDashboard(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <LoaderCircle className="w-6 h-6 animate-spin text-gray-700" />
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-3 rounded border border-red-200 mb-3">
              {error}
            </div>
          ) : data ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Problems:</span>
                <span className="font-bold">{data.totalProblems}</span>
              </div>
              <div className="flex justify-between">
                <span>Follow-up Questions:</span>
                <span className="font-bold">{data.totalFollowUps}</span>
              </div>
              <div className="flex justify-between">
                <span>Quizzes Generated:</span>
                <span className="font-bold">{data.totalQuizzes}</span>
              </div>
              <div className="flex justify-between">
                <span>Unique Visitors:</span>
                <span className="font-bold">{data.uniqueVisitors}</span>
              </div>
              <div className="flex justify-between">
                <span>Rate Limit Hits:</span>
                <span className="font-bold">{data.rateLimit}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No analytics data available</p>
          )}
          
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="mt-3 w-full p-2 bg-gray-100 hover:bg-gray-200 rounded text-sm disabled:opacity-50"
          >
            Refresh Data
          </button>
        </div>
      )}
    </div>
  );
}
