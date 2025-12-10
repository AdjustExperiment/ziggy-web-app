import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB, Metric } from 'web-vitals';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';

interface WebVitalsMetrics {
  fcp?: number;
  lcp?: number;
  cls?: number;
  ttfb?: number;
  fid?: number;
  inp?: number;
}

const generateSessionId = (): string => {
  const stored = sessionStorage.getItem('ziggy-session-id');
  if (stored) return stored;
  const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('ziggy-session-id', newId);
  return newId;
};

const getDeviceType = (): string => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

const getConnectionType = (): string => {
  const nav = navigator as any;
  if (nav.connection) {
    return nav.connection.effectiveType || 'unknown';
  }
  return 'unknown';
};

export function useWebVitals() {
  const location = useLocation();
  const { user } = useOptimizedAuth();
  const metricsRef = useRef<WebVitalsMetrics>({});
  const sentRef = useRef(false);

  useEffect(() => {
    // Reset on route change
    metricsRef.current = {};
    sentRef.current = false;

    const handleMetric = (metric: Metric) => {
      const name = metric.name.toLowerCase();
      metricsRef.current[name as keyof WebVitalsMetrics] = metric.value;
    };

    // Register web vitals observers
    onCLS(handleMetric);
    onFCP(handleMetric);
    onFID(handleMetric);
    onINP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);

    // Send metrics after page load
    const sendMetrics = async () => {
      if (sentRef.current) return;
      if (Object.keys(metricsRef.current).length === 0) return;

      sentRef.current = true;

      try {
        await supabase.functions.invoke('collect-performance-metrics', {
          body: {
            user_id: user?.id || null,
            session_id: generateSessionId(),
            route: location.pathname,
            ...metricsRef.current,
            device_type: getDeviceType(),
            connection_type: getConnectionType(),
            user_agent: navigator.userAgent,
          }
        });
      } catch (error) {
        console.warn('Failed to send performance metrics:', error);
      }
    };

    // Send after 5 seconds to capture most metrics
    const timeout = setTimeout(sendMetrics, 5000);

    // Also send on page hide (user navigating away)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendMetrics();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname, user?.id]);

  return metricsRef.current;
}
