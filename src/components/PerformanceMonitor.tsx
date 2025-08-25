import React, { useEffect } from 'react';
import { usePerformanceMetrics } from '@/hooks/useOptimizedData';

export function PerformanceMonitor() {
  const metrics = usePerformanceMetrics();

  useEffect(() => {
    if (typeof window === 'undefined' || !metrics) return;

    // Log performance metrics for monitoring
    console.group('🚀 Performance Metrics');
    console.log('DOM Content Loaded:', `${metrics.domContentLoaded.toFixed(2)}ms`);
    console.log('Page Load Complete:', `${metrics.loadComplete.toFixed(2)}ms`);
    console.log('DOM Complete:', `${metrics.domComplete.toFixed(2)}ms`);
    console.log('DNS Lookup:', `${metrics.dns.toFixed(2)}ms`);
    console.log('TCP Connection:', `${metrics.tcp.toFixed(2)}ms`);
    console.log('Time to First Byte:', `${metrics.ttfb.toFixed(2)}ms`);
    console.log('First Contentful Paint:', `${metrics.fcp.toFixed(2)}ms`);
    console.log('Resources Loaded:', metrics.resources);
    console.groupEnd();

    // Report to analytics service (if configured)
    if ((window as any).gtag) {
      (window as any).gtag('event', 'performance_metrics', {
        dom_content_loaded: Math.round(metrics.domContentLoaded),
        load_complete: Math.round(metrics.loadComplete),
        first_contentful_paint: Math.round(metrics.fcp),
        resources_count: metrics.resources,
      });
    }

    // Web Vitals monitoring
    if ('web-vital' in window) {
      // @ts-ignore
      window['web-vital'].getCLS(console.log);
      // @ts-ignore
      window['web-vital'].getFID(console.log);
      // @ts-ignore
      window['web-vital'].getFCP(console.log);
      // @ts-ignore
      window['web-vital'].getLCP(console.log);
      // @ts-ignore
      window['web-vital'].getTTFB(console.log);
    }
  }, [metrics]);

  // Only render in development mode
  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="text-green-400 font-bold mb-1">⚡ Performance</div>
      {metrics && (
        <>
          <div>DOM: {metrics.domContentLoaded.toFixed(0)}ms</div>
          <div>Load: {metrics.loadComplete.toFixed(0)}ms</div>
          <div>FCP: {metrics.fcp.toFixed(0)}ms</div>
          <div>Resources: {metrics.resources}</div>
        </>
      )}
    </div>
  );
}