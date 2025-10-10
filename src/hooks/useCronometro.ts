import { useState, useEffect, useCallback } from 'react';

export function useCronometro() {
  const [segundosDecorridos, setSegundosDecorridos] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isRunning) {
      intervalId = setInterval(() => {
        setSegundosDecorridos(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning]);

  const start = useCallback(() => {
    setIsRunning(true);
    if (!startTime) {
      setStartTime(new Date());
    }
  }, [startTime]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setSegundosDecorridos(0);
    setStartTime(null);
  }, []);

  return {
    segundosDecorridos,
    isRunning,
    startTime,
    start,
    pause,
    reset
  };
}
