// frontend/src/hooks/useTimer.ts

import { useEffect, useRef } from "react";

// CHQ: Claude AI (Sonnet) generated file

/** Calls `onTick` every `intervalMs` while `isRunning` is true. */
export const useTimer = (isRunning: boolean, onTick: () => void, intervalMs = 1000) => {
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => onTickRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [isRunning, intervalMs]);
};