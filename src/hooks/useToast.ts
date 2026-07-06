import { useCallback, useEffect, useRef, useState } from "react";

/** Ephemeral toast message state with auto-dismiss. */
export function useToast(durationMs = 2600): {
  toast: string | null;
  showToast: (message: string) => void;
} {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string) => {
      if (timer.current) clearTimeout(timer.current);
      setToast(message);
      timer.current = setTimeout(() => setToast(null), durationMs);
    },
    [durationMs],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { toast, showToast };
}
