import { useEffect, useState } from "react";

/**
 * 値が delayMs の間変わらなくなってから反映する。
 * 検索語を打鍵のたびにサーバへ送らないために使う。
 */
export const useDebouncedValue = <T,>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};
