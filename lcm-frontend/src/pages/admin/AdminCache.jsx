import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../hooks/useConfirm.jsx';

export default function AdminCache() {
  const [cacheStats, setCacheStats] = useState({});
  const [cacheNames, setCacheNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    fetchCacheData();
  }, []);

  const fetchCacheData = async () => {
    setRefreshing(true);
    try {
      const [statsResponse, namesResponse] = await Promise.all([
        api.get('/admin/cache/stats'),
        api.get('/admin/cache/names')
      ]);
      
      setCacheStats(statsResponse.data.data || {});
      setCacheNames(namesResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching cache data:', error);
      toast.error('Failed to fetch cache data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleClearCache = async (cacheName) => {
    const confirmed = await confirm({
      title: 'Clear Cache',
      message: `Are you sure you want to clear the "${cacheName}" cache? This will remove all cached entries.`,
      confirmText: 'Clear Cache',
      confirmColor: 'red'
    });

    if (!confirmed) return;

    try {
      await api.delete(`/admin/cache/clear/${cacheName}`);
      toast.success(`Cache "${cacheName}" cleared successfully`);
      fetchCacheData();
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    }
  };

  const handleClearAllCaches = async () => {
    const confirmed = await confirm({
      title: 'Clear All Caches',
      message: 'Are you sure you want to clear ALL caches? This will remove all cached entries from the entire system.',
      confirmText: 'Clear All',
      confirmColor: 'red'
    });

    if (!confirmed) return;

    try {
      await api.delete('/admin/cache/clear');
      toast.success('All caches cleared successfully');
      fetchCacheData();
    } catch (error) {
      console.error('Error clearing all caches:', error);
      toast.error('Failed to clear all caches');
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (num) => {
    return `${(num * 100).toFixed(2)}%`;
  };

  const calculateTotalStats = () => {
    let total = {
      size: 0,
      hitCount: 0,
      missCount: 0,
      evictionCount: 0
    };

    Object.values(cacheStats).forEach(stats => {
      total.size += stats.size;
      total.hitCount += stats.hitCount;
      total.missCount += stats.missCount;
      total.evictionCount += stats.evictionCount;
    });

    const totalRequests = total.hitCount + total.missCount;
    total.hitRate = totalRequests > 0 ? total.hitCount / totalRequests : 0;

    return total;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalStats = calculateTotalStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ConfirmDialog />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cache Management</h1>
          <p className="text-gray-600 mt-2">Monitor and manage application caches</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchCacheData}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={handleClearAllCaches}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All Caches
          </button>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-blue-100 text-sm font-medium">Total Caches</div>
            <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div className="text-3xl font-bold">{cacheNames.length}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-green-100 text-sm font-medium">Cache Entries</div>
            <svg className="w-8 h-8 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <div className="text-3xl font-bold">{formatNumber(totalStats.size)}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-purple-100 text-sm font-medium">Hit Rate</div>
            <svg className="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-3xl font-bold">{formatPercentage(totalStats.hitRate)}</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-yellow-100 text-sm font-medium">Total Hits</div>
            <svg className="w-8 h-8 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold">{formatNumber(totalStats.hitCount)}</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-red-100 text-sm font-medium">Total Misses</div>
            <svg className="w-8 h-8 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold">{formatNumber(totalStats.missCount)}</div>
        </div>
      </div>

      {/* Individual Cache Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cacheNames.map(cacheName => {
          const stats = cacheStats[cacheName] || {};
          const totalRequests = stats.hitCount + stats.missCount;
          
          return (
            <div key={cacheName} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">{cacheName}</h3>
                </div>
                <button
                  onClick={() => handleClearCache(cacheName)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  Clear
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Entries</div>
                    <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.size)}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Hit Rate</div>
                    <div className="text-2xl font-bold text-green-600">{formatPercentage(stats.hitRate)}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Cache Hits</span>
                    <span className="font-semibold text-gray-900">{formatNumber(stats.hitCount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Cache Misses</span>
                    <span className="font-semibold text-gray-900">{formatNumber(stats.missCount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Total Requests</span>
                    <span className="font-semibold text-gray-900">{formatNumber(totalRequests)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Evictions</span>
                    <span className="font-semibold text-gray-900">{formatNumber(stats.evictionCount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Load Failures</span>
                    <span className="font-semibold text-gray-900">{formatNumber(stats.loadFailureCount)}</span>
                  </div>
                </div>

                {/* Hit Rate Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Performance</span>
                    <span>{formatPercentage(stats.hitRate)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        stats.hitRate >= 0.8 ? 'bg-green-500' : 
                        stats.hitRate >= 0.5 ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`}
                      style={{ width: `${stats.hitRate * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {cacheNames.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Caches Found</h3>
          <p className="text-gray-500">Cache system is not configured or no caches are available.</p>
        </div>
      )}
    </div>
  );
}
