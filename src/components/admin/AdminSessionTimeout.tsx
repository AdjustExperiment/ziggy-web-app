import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes warning
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
const STORAGE_KEY = 'admin_last_activity';

export function AdminSessionTimeout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const updateLastActivity = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, Date.now().toString());
  }, []);

  const handleLogout = useCallback(async () => {
    setShowWarning(false);
    try {
      await signOut();
      toast({
        title: 'Session Expired',
        description: 'You have been logged out due to inactivity.',
        variant: 'destructive',
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  }, [signOut, navigate]);

  const handleStayLoggedIn = useCallback(() => {
    setShowWarning(false);
    updateLastActivity();
    resetTimers();
  }, [updateLastActivity]);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const resetTimers = useCallback(() => {
    clearTimers();

    // Set warning timer (5 min before timeout)
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingSeconds(Math.floor(WARNING_BEFORE_TIMEOUT_MS / 1000));
      
      // Start countdown
      countdownRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_TIMEOUT_MS);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearTimers, handleLogout]);

  const handleActivity = useCallback(() => {
    if (!showWarning) {
      updateLastActivity();
      resetTimers();
    }
  }, [showWarning, updateLastActivity, resetTimers]);

  useEffect(() => {
    if (!user) return;

    // Initialize last activity
    updateLastActivity();
    resetTimers();

    // Add activity listeners
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, handleActivity, updateLastActivity, resetTimers, clearTimers]);

  // Check for stale session on mount
  useEffect(() => {
    const lastActivity = sessionStorage.getItem(STORAGE_KEY);
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10);
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        handleLogout();
      }
    }
  }, [handleLogout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent className="bg-background border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">Session Expiring Soon</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Your admin session will expire in{' '}
            <span className="font-semibold text-destructive">{formatTime(remainingSeconds)}</span>{' '}
            due to inactivity. Do you want to stay logged in?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogout} className="border-border">
            Log Out
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleStayLoggedIn}>
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
