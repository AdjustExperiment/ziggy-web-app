import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';

interface InteractionLog {
  route: string;
  scroll_depth: number;
  load_time_ms: number;
  device_type: string;
}

const getDeviceType = (): string => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

const generateSessionId = (): string => {
  const stored = sessionStorage.getItem('ziggy-session-id');
  if (stored) return stored;
  const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('ziggy-session-id', newId);
  return newId;
};

export function useInteractionLogging() {
  const location = useLocation();
  const { user } = useOptimizedAuth();
  const pageLoadTime = useRef(Date.now());
  const maxScrollDepth = useRef(0);
  const loggedRef = useRef(false);

  const calculateScrollDepth = useCallback(() => {
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    
    if (docHeight <= windowHeight) return 100;
    
    const scrolled = (scrollTop + windowHeight) / docHeight * 100;
    return Math.min(100, Math.round(scrolled));
  }, []);

  const sendInteractionLog = useCallback(async () => {
    if (loggedRef.current) return;
    loggedRef.current = true;

    const loadTime = Date.now() - pageLoadTime.current;
    const scrollDepth = Math.max(maxScrollDepth.current, calculateScrollDepth());

    try {
      await supabase.from('user_interaction_logs').insert({
        user_id: user?.id || null,
        session_id: generateSessionId(),
        route: location.pathname,
        scroll_depth: scrollDepth,
        load_time_ms: loadTime,
        device: getDeviceType(),
        user_role: 'anonymous',
      });
    } catch (error) {
      console.warn('Failed to log interaction:', error);
    }
  }, [user?.id, location.pathname, calculateScrollDepth]);

  useEffect(() => {
    // Reset on route change
    pageLoadTime.current = Date.now();
    maxScrollDepth.current = 0;
    loggedRef.current = false;

    const handleScroll = () => {
      const currentDepth = calculateScrollDepth();
      maxScrollDepth.current = Math.max(maxScrollDepth.current, currentDepth);
    };

    // Debounced scroll handler
    let scrollTimeout: NodeJS.Timeout;
    const debouncedScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', debouncedScroll, { passive: true });

    // Send log when leaving page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendInteractionLog();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also send after 30 seconds as fallback
    const timeout = setTimeout(sendInteractionLog, 30000);

    return () => {
      window.removeEventListener('scroll', debouncedScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(timeout);
      clearTimeout(scrollTimeout);
    };
  }, [location.pathname, calculateScrollDepth, sendInteractionLog]);
}
