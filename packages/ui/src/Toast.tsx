import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type ToastStatus = "neutral" | "info" | "loading" | "success" | "error";

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type ToastAction = {
  label: string;
  onClick: (toast: Toast) => void;
};

export type Toast = {
  id: string;
  title: string;
  description?: string;
  status?: ToastStatus;
  duration?: number;
  dismissible?: boolean;
  createdAt?: number;
};

export type ToastInput = Omit<Toast, "id" | "createdAt"> & {
  id?: string;
};

export type UseToastOptions = {
  initialToasts?: ToastInput[];
  defaultDuration?: number;
  limit?: number;
};

let idSeed = 0;

function createToast(input: ToastInput, defaultDuration: number): Toast {
  return {
    duration: defaultDuration,
    dismissible: true,
    ...input,
    id: input.id ?? `toast-${idSeed++}`,
    createdAt: Date.now(),
  };
}

export function useToast({
  initialToasts = [],
  defaultDuration = 4200,
  limit,
}: UseToastOptions = {}) {
  const timersRef = useRef<Map<string, number>>(new Map());
  const [toasts, setToasts] = useState<Toast[]>(() =>
    initialToasts.map((toast) => createToast(toast, defaultDuration)),
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (input: ToastInput) => {
      const toast = createToast(input, defaultDuration);

      setToasts((current) => {
        const next = [...current.filter((item) => item.id !== toast.id), toast];
        return typeof limit === "number" ? next.slice(-limit) : next;
      });

      return toast.id;
    },
    [defaultDuration, limit],
  );

  const updateToast = useCallback((id: string, patch: Partial<ToastInput>) => {
    setToasts((current) =>
      current.map((toast) =>
        toast.id === id
          ? {
              ...toast,
              ...patch,
              id,
              createdAt:
                patch.duration === undefined ? toast.createdAt : Date.now(),
            }
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

      if (duration <= 0) {
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
    () => ({ toasts, showToast, updateToast, dismissToast, clearToasts }),
    [clearToasts, dismissToast, showToast, toasts, updateToast],
  );
}
