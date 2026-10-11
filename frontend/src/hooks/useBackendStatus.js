import { useState, useEffect, useCallback } from 'react';
import { checkBackendHealth } from '../services/api';

export function useBackendStatus({ pollInterval = 30000, autoCheck = true } = {}) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'online' | 'offline'
  const [latency, setLatency] = useState(null);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const check = useCallback(async () => {
    setIsRefreshing(true);
    const result = await checkBackendHealth();
    setIsRefreshing(false);
    setLastChecked(new Date());

    if (result.isOnline) {
      setStatus('online');
      setLatency(result.latency);
      setDetails(result.data);
      setError(null);
    } else {
      setStatus('offline');
      setLatency(null);
      setDetails(null);
      setError(result.error);
    }
    return result;
  }, []);

  useEffect(() => {
    if (!autoCheck) return;
    check();

    if (pollInterval > 0) {
      const timer = setInterval(check, pollInterval);
      return () => clearInterval(timer);
    }
  }, [check, autoCheck, pollInterval]);

  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isChecking: status === 'checking' || isRefreshing,
    latency,
    details,
    error,
    lastChecked,
    refetch: check,
  };
}
