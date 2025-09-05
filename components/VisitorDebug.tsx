'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVisitorStore } from '@/lib/visitorStore';

interface VisitorDebugProps {
  adminKey: string;
}

export function VisitorDebug({ adminKey }: VisitorDebugProps) {
  interface DebugData {
    visitorId: string;
    visitorInfo: {
      browser?: string;
      os?: string;
      device?: string;
      ip?: string;
      country?: string;
      city?: string;
      timezone?: string;
      lastSeen?: string;
    };
    rateLimit: {
      remaining: number;
      total: number;
      resetAt: string;
      count?: number;
      timestamp?: string;
    };
    analytics: {
      totalProblems: number;
      totalSessions: number;
      averageSessionTime: number;
    };
    eventCounts: {
      problems: number;
      followUps: number;
      quizzes: number;
      sessions: number;
      rateLimit: number;
    };
    memberOfSets: {
      highUsage: boolean;
      recentUsers: boolean;
      betaTesters: boolean;
      admins: boolean;
      dailyVisitors: boolean;
      problemVisitors: boolean;
      followUpVisitors: boolean;
      quizVisitors: boolean;
    };
    timeline: Array<{
      timestamp: string;
      event: string;
      details: string;
    }>;
  }

  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { visitorId } = useVisitorStore();
  
  const fetchDebugData = useCallback(async () => {
    if (!visitorId || !adminKey) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/debug-visitor?adminKey=${adminKey}&visitorId=${encodeURIComponent(visitorId)}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch debug data');
      }
      
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      console.error('Failed to fetch debug data:', error);
      setError((error as Error).message || 'Failed to fetch debug data');
    } finally {
      setLoading(false);
    }
  }, [adminKey, visitorId]);
  
  useEffect(() => {
    if (visitorId && adminKey) {
      fetchDebugData();
    }
  }, [visitorId, adminKey, fetchDebugData]);
  
  if (!visitorId) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Visitor ID Not Available</h3>
        <p className="text-yellow-700">
          Waiting for visitor ID to be initialized...
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800">Current Visitor Debug</h3>
        <button
          onClick={fetchDebugData}
          disabled={loading}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center">
          <span className="font-semibold mr-2">Visitor ID:</span>
          <code className="bg-gray-100 px-2 py-1 rounded text-sm">{visitorId}</code>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 p-3 rounded border border-red-200 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-4 text-gray-500">Loading visitor data...</div>
      ) : debugData ? (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Event Counts</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 p-2 rounded">
                <div className="text-xs text-blue-600">Problems</div>
                <div className="font-bold text-blue-800">{debugData.eventCounts.problems}</div>
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <div className="text-xs text-purple-600">Follow-ups</div>
                <div className="font-bold text-purple-800">{debugData.eventCounts.followUps}</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="text-xs text-green-600">Quizzes</div>
                <div className="font-bold text-green-800">{debugData.eventCounts.quizzes}</div>
              </div>
              <div className="bg-amber-50 p-2 rounded">
                <div className="text-xs text-amber-600">Rate Limits</div>
                <div className="font-bold text-amber-800">{debugData.eventCounts.rateLimit}</div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Visitor Sets</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between items-center">
                <span>In Daily Visitors:</span>
                <span className={debugData.memberOfSets.dailyVisitors ? "text-green-600 font-semibold" : "text-red-600"}>
                  {debugData.memberOfSets.dailyVisitors ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>In Problem Visitors:</span>
                <span className={debugData.memberOfSets.problemVisitors ? "text-green-600 font-semibold" : "text-red-600"}>
                  {debugData.memberOfSets.problemVisitors ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>In Follow-up Visitors:</span>
                <span className={debugData.memberOfSets.followUpVisitors ? "text-green-600 font-semibold" : "text-red-600"}>
                  {debugData.memberOfSets.followUpVisitors ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>In Quiz Visitors:</span>
                <span className={debugData.memberOfSets.quizVisitors ? "text-green-600 font-semibold" : "text-red-600"}>
                  {debugData.memberOfSets.quizVisitors ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
          
          {debugData.rateLimit && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Rate Limit Status</h4>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <div className="flex justify-between mb-1">
                  <span>Count:</span>
                  <span className="font-semibold">{debugData.rateLimit.count || 0} / 5</span>
                </div>
                <div className="flex justify-between">
                  <span>Resets At:</span>
                  <span className="font-semibold">
                    {new Date(Number(debugData.rateLimit.timestamp || Date.now()) + 24 * 60 * 60 * 1000).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {debugData.timeline && debugData.timeline.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Event Timeline</h4>
              <div className="bg-gray-50 p-3 rounded text-sm max-h-40 overflow-y-auto">
                <ul className="space-y-1">
                  {debugData.timeline.map((item, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{item.event}</span>
                      <span className="text-gray-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">No visitor data available</div>
      )}
    </div>
  );
}
