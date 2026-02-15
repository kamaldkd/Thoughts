import { useEffect, useState } from "react";

export function useMinuteTick() {
  const [, setTick] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const start = () => {
      if (!interval) {
        interval = setInterval(() => {
          setTick(t => t + 1);
        }, 60000);
      }
    };

    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();   // ⏸ tab inactive
      } else {
        start();  // ▶ tab active
      }
    };

    start(); // start initially
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stop();
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);
}