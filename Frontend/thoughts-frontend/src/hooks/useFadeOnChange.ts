import { useEffect, useState } from "react";

export function useFadeOnChange(value: string) {
  const [displayValue, setDisplayValue] = useState(value);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setFade(true);

      const timeout = setTimeout(() => {
        setDisplayValue(value);
        setFade(false);
      }, 150);

      return () => clearTimeout(timeout);
    }
  }, [value, displayValue]);

  return { displayValue, fade };
}