import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useWebVitals } from '@/hooks/useWebVitals';
import { useInteractionLogging } from '@/hooks/useInteractionLogging';

/**
 * Component that collects Web Vitals and interaction data.
 * Must be rendered inside a Router context.
 */
export function VitalsCollector() {
  const location = useLocation();
  
  // Collect Core Web Vitals
  useWebVitals();
  
  // Log user interactions
  useInteractionLogging();
  
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[VitalsCollector] Route changed:', location.pathname);
    }
  }, [location.pathname]);
  
  return null;
}
