import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to manage loading states with a minimum duration to prevent flickering
 * 
 * @param isActuallyLoading - The actual loading state from your async operation
 * @param minimumDuration - Minimum time to show loading state (in milliseconds)
 * @returns boolean indicating whether to show loading state
 */
export function useMinimumLoadingTime(
  isActuallyLoading: boolean, 
  minimumDuration: number = 500
): boolean {
  const [showLoading, setShowLoading] = useState(true);
  const startTimeRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset start time when loading begins
    if (isActuallyLoading && !showLoading) {
      startTimeRef.current = Date.now();
      setShowLoading(true);
    }

    // When actual loading finishes, check if minimum time has passed
    if (!isActuallyLoading && showLoading) {
      const elapsedTime = Date.now() - startTimeRef.current;
      const remainingTime = minimumDuration - elapsedTime;

      if (remainingTime > 0) {
        // Wait for the remaining time before hiding loading
        timeoutRef.current = setTimeout(() => {
          setShowLoading(false);
        }, remainingTime);
      } else {
        // Minimum time has already passed, hide loading immediately
        setShowLoading(false);
      }
    }

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isActuallyLoading, showLoading, minimumDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return showLoading;
}

/**
 * Hook for managing loading states with smooth transitions
 * Provides both immediate loading state and delayed loading state for smooth UX
 */
export function useSmoothLoading(
  isActuallyLoading: boolean,
  options: {
    minimumDuration?: number;
    delayBeforeShowing?: number;
  } = {}
) {
  const { minimumDuration = 500, delayBeforeShowing = 200 } = options;
  
  const [shouldShowLoading, setShouldShowLoading] = useState(false);
  const [isDelayedLoading, setIsDelayedLoading] = useState(false);
  
  const showLoadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideLoadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    // Clear any existing timeouts
    if (showLoadingTimeoutRef.current) {
      clearTimeout(showLoadingTimeoutRef.current);
      showLoadingTimeoutRef.current = null;
    }
    if (hideLoadingTimeoutRef.current) {
      clearTimeout(hideLoadingTimeoutRef.current);
      hideLoadingTimeoutRef.current = null;
    }

    if (isActuallyLoading) {
      // Start loading - show after delay to prevent flash for quick loads
      startTimeRef.current = Date.now();
      
      showLoadingTimeoutRef.current = setTimeout(() => {
        setShouldShowLoading(true);
        setIsDelayedLoading(true);
      }, delayBeforeShowing);
    } else {
      // Stop loading - ensure minimum duration if we showed loading
      if (shouldShowLoading) {
        const elapsedTime = Date.now() - startTimeRef.current;
        const remainingTime = minimumDuration - elapsedTime;

        if (remainingTime > 0) {
          hideLoadingTimeoutRef.current = setTimeout(() => {
            setShouldShowLoading(false);
            setIsDelayedLoading(false);
          }, remainingTime);
        } else {
          setShouldShowLoading(false);
          setIsDelayedLoading(false);
        }
      } else {
        // Loading finished before delay, don't show loading at all
        setShouldShowLoading(false);
        setIsDelayedLoading(false);
      }
    }

    return () => {
      if (showLoadingTimeoutRef.current) {
        clearTimeout(showLoadingTimeoutRef.current);
      }
      if (hideLoadingTimeoutRef.current) {
        clearTimeout(hideLoadingTimeoutRef.current);
      }
    };
  }, [isActuallyLoading, delayBeforeShowing, minimumDuration]);

  return {
    shouldShowLoading,
    isDelayedLoading
  };
}
