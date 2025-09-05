"use client";

import { useState, useEffect, useCallback } from 'react';
import { BarChart, LoaderCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAdminStore } from '@/lib/store';
import { VisitorDebug } from '@/components/VisitorDebug';

interface AnalyticsData {
  totalProblems: number;
  totalVisitors: number;
  totalSessions: number;
  averageSessionTime: number;
  problemsPerDay: {
    date: string;
    count: number;
  }[];
  visitorsPerDay: {
    date: string;
    count: number;
  }[];
  today: {
    problems: number;
    visitors: number;
  };
  topProblems: {
    problem: string;
    count: number;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputAdminKey, setInputAdminKey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { adminKey, setAdminKey, clearAdminKey } = useAdminStore();

  const fetchAnalytics = useCallback(async (key: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/analytics?adminKey=${key}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }
      
      const analyticsData = await response.json();
      setData(analyticsData);
      setIsAuthenticated(true);
      setAdminKey(key);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError((error as Error).message || 'Failed to fetch analytics data');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [setAdminKey]);
  
  // Check for stored admin key in Zustand store
  useEffect(() => {
    if (adminKey) {
      setIsAuthenticated(true);
      fetchAnalytics(adminKey);
    } else {
      // Try to get from environment variable as fallback
      const envKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
      if (envKey) {
        setAdminKey(envKey);
        setIsAuthenticated(true);
        fetchAnalytics(envKey);
      } else {
        setLoading(false);
      }
    }
  }, [adminKey, fetchAnalytics, setAdminKey]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalytics(inputAdminKey);
  };
  
  const handleLogout = () => {
    clearAdminKey();
    setIsAuthenticated(false);
    setData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">View usage statistics for the Algebra Tutor</p>
          </div>
          <Link 
            href="/"
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Tutor
          </Link>
        </div>
        
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Admin Login</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label htmlFor="adminKey" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Key
                </label>
                <input
                  type="password"
                  id="adminKey"
                  value={inputAdminKey}
                  onChange={(e) => setInputAdminKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter admin key"
                  required
                />
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Login
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Analytics Overview</h2>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Logout
                </button>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : data ? (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Today&apos;s Activity</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-600">Today&apos;s Problems</p>
                      <p className="mt-2 text-3xl font-semibold text-blue-900">{data.today.problems}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-green-600">Today&apos;s Visitors</p>
                      <p className="mt-2 text-3xl font-semibold text-green-900">{data.today.visitors}</p>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Overall Statistics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-500">Total Problems</p>
                      <p className="mt-2 text-2xl font-semibold">{data.totalProblems}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-500">Total Visitors</p>
                      <p className="mt-2 text-2xl font-semibold">{data.totalVisitors}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                      <p className="mt-2 text-2xl font-semibold">{data.totalSessions}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-500">Avg. Session Time</p>
                      <p className="mt-2 text-2xl font-semibold">{Math.round(data.averageSessionTime / 60)} min</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                        <BarChart className="w-4 h-4 mr-2 text-blue-600" />
                        Problems Per Day (Last 7 Days)
                      </h4>
                      <div className="h-64 flex items-end space-x-2">
                        {data.problemsPerDay.map((day, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-full bg-blue-500 rounded-t"
                              style={{ 
                                height: `${Math.max(
                                  (day.count / Math.max(...data.problemsPerDay.map(d => d.count))) * 200, 
                                  10
                                )}px` 
                              }}
                            ></div>
                            <p className="text-xs mt-2 text-gray-600">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                            <p className="text-xs font-medium">{day.count}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                        <BarChart className="w-4 h-4 mr-2 text-green-600" />
                        Visitors Per Day (Last 7 Days)
                      </h4>
                      <div className="h-64 flex items-end space-x-2">
                        {data.visitorsPerDay.map((day, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-full bg-green-500 rounded-t"
                              style={{ 
                                height: `${Math.max(
                                  (day.count / Math.max(...data.visitorsPerDay.map(d => d.count))) * 200, 
                                  10
                                )}px` 
                              }}
                            ></div>
                            <p className="text-xs mt-2 text-gray-600">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                            <p className="text-xs font-medium">{day.count}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200 mb-8">
                    <h4 className="font-medium text-gray-900 mb-4">Top Problems</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Problem</th>
                            <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {data.topProblems.map((problem, i) => (
                            <tr key={i}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{problem.problem}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{problem.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-100 text-red-800 rounded-md">
                  {error}
                </div>
              ) : null}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-6">Visitor Debug</h2>
              <VisitorDebug adminKey={adminKey} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}