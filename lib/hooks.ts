import { useEffect, useRef, useState } from 'react';

/** Simulates a network fetch delay so skeleton loaders have something to do. */
export function useFakeLoading(ms = 700): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, []);
  return loading;
}

/** Simple pull-to-refresh simulator: flips `refreshing` true, then false after a delay. */
export function useFakeRefresh(ms = 900) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), ms);
  };
  return { refreshing, onRefresh };
}

/** Eases a number from 0 to `target` over `duration`ms — drives animated stat counters. */
export function useCountUp(target: number, duration = 900, startDelay = 0): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    let start: number | undefined;
    const startTimer = setTimeout(() => {
      const tick = (now: number) => {
        if (start === undefined) start = now;
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    }, startDelay);

    return () => {
      clearTimeout(startTimer);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration, startDelay]);

  return value;
}
