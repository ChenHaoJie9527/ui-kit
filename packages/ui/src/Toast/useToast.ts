import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createToast } from "./toast-utils";
import type {
  Toast,
  ToastInput,
  ToastUpdateInput,
  UseToastOptions,
} from "./toast-types";

type ManagedToast = Toast & { pausedAt?: number };

export function useToast({
  initialToasts = [],
  defaultDuration = 4200,
  limit,
}: UseToastOptions = {}) {
  const timersRef = useRef<Map<string, number>>(new Map());
  const [toasts, setToasts] = useState<ManagedToast[]>(() =>
    initialToasts.map((toast) => createToast(toast, defaultDuration)),
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (input: Omit<ToastInput, "id">) => {
      const toast = createToast(input, defaultDuration);

      setToasts((current) => {
        const next = [...current, toast];
        return typeof limit === "number" ? next.slice(-limit) : next;
      });

      return toast.id;
    },
    [defaultDuration, limit],
  );

  const updateToast = useCallback((id: string, patch: ToastUpdateInput) => {
    setToasts((current) =>
      current.map((toast) =>
        toast.id === id
          ? {
              ...toast,
              ...patch,
              createdAt:
                patch.duration === undefined ? toast.createdAt : Date.now(),
            }
          : toast,
      ),
    );
  }, []);

  const pauseToast = useCallback((id: string) => {
    setToasts((current) =>
      current.map((toast) =>
        toast.id === id ? { ...toast, pausedAt: Date.now() } : toast,
      ),
    );
  }, []);

  const resumeToast = useCallback((id: string) => {
    setToasts((current) =>
      current.map((toast) =>
        toast.id === id
          ? { ...toast, pausedAt: undefined, createdAt: Date.now() }
          : toast,
      ),
    );
  }, []);

  useEffect(() => {
    const timers = timersRef.current;

    for (const [id, timer] of timers) {
      if (!toasts.some((toast) => toast.id === id)) {
        window.clearTimeout(timer);
        timers.delete(id);
      }
    }

    for (const toast of toasts) {
      const duration = toast.duration ?? defaultDuration;
      const previousTimer = timers.get(toast.id);

      if (duration <= 0 || toast.pausedAt !== undefined) {
        if (previousTimer !== undefined) {
          window.clearTimeout(previousTimer);
          timers.delete(toast.id);
        }
        continue;
      }

      if (previousTimer !== undefined) {
        window.clearTimeout(previousTimer);
      }

      const createdAt = toast.createdAt ?? Date.now();
      const remaining = Math.max(duration - (Date.now() - createdAt), 0);
      const timer = window.setTimeout(() => {
        timers.delete(toast.id);
        dismissToast(toast.id);
      }, remaining);

      timers.set(toast.id, timer);
    }
  }, [defaultDuration, dismissToast, toasts]);

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  return useMemo(
    () => ({
      toasts,
      showToast,
      updateToast,
      dismissToast,
      clearToasts,
      pauseToast,
      resumeToast,
    }),
    [
      clearToasts,
      dismissToast,
      pauseToast,
      resumeToast,
      showToast,
      toasts,
      updateToast,
    ],
  );
}
