import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleCheckBigIcon,
  CircleHelpIcon,
  LoaderCircleIcon,
  MessageCircleIcon,
  MessageCircleXIcon,
  XIcon,
  type LoaderCircleIconHandle,
} from "lucide-animated";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { EASE_OUT, REDUCED_MOTION_TRANSITION, UI_SPRING } from "./motion";
import { cx } from "./utils/cx";

export type ToastStatus = "neutral" | "info" | "loading" | "success" | "error";

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type ToastAction = {
  label: ReactNode;
  onClick: (toast: Toast) => void;
};

export type Toast = {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  status?: ToastStatus;
  action?: ToastAction;
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

export type ToastPlacement = "static" | "absolute" | "fixed";

export type ToastClassNames = {
  root?: string;
  item?: string;
  surface?: string;
  iconWrap?: string;
  content?: string;
  title?: string;
  description?: string;
  action?: string;
  close?: string;
};

export type ToastIcons = Partial<Record<ToastStatus, ReactNode>>;

export type ToastStackProps = Omit<HTMLMotionProps<"ol">, "children"> & {
  toasts: Toast[];
  onDismiss?: (id: string) => void;
  onPauseToast?: (id: string) => void;
  onResumeToast?: (id: string) => void;
  position?: ToastPosition;
  placement?: ToastPlacement;
  portal?: boolean;
  portalRoot?: Element | null;
  maxVisible?: number;
  className?: string;
  classNames?: ToastClassNames;
  icons?: ToastIcons;
  renderToast?: (toast: Toast) => ReactNode;
};

function createStatusIcons(
  reducedMotion: boolean,
): Record<ToastStatus, ReactNode> {
  const animateOnHover = !reducedMotion;

  return {
    neutral: (
      <MessageCircleIcon
        aria-hidden
        size={16}
        animateOnHover={animateOnHover}
      />
    ),
    info: (
      <CircleHelpIcon aria-hidden size={16} animateOnHover={animateOnHover} />
    ),
    loading: <LoadingIcon reducedMotion={reducedMotion} />,
    success: (
      <CircleCheckBigIcon
        aria-hidden
        size={16}
        animateOnHover={animateOnHover}
      />
    ),
    error: (
      <MessageCircleXIcon
        aria-hidden
        size={16}
        animateOnHover={animateOnHover}
      />
    ),
  };
}

function LoadingIcon({ reducedMotion }: { reducedMotion: boolean }) {
  const iconRef = useRef<LoaderCircleIconHandle>(null);

  useEffect(() => {
    if (!reducedMotion) {
      iconRef.current?.startAnimation();
    }
  }, [reducedMotion]);

  return (
    <LoaderCircleIcon
      ref={iconRef}
      aria-hidden
      size={16}
      animateOnHover={false}
    />
  );
}

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

export function ToastStack({
  toasts,
  onDismiss,
  onPauseToast,
  onResumeToast,
  position = "bottom-right",
  placement = "fixed",
  portal,
  portalRoot,
  maxVisible = 4,
  className,
  classNames,
  icons,
  renderToast,
  ...listProps
}: ToastStackProps) {
  const shouldPortal = portal ?? placement === "fixed";
  const visibleToasts = toasts.slice(-Math.max(maxVisible, 0));

  const stack = (
    <motion.ol
      {...listProps}
      aria-live="polite"
      aria-atomic="false"
      data-position={position}
      data-placement={placement}
      className={cx(
        "uk-toast",
        placement !== "static" && "uk-toast--floating",
        classNames?.root,
        className,
      )}
      initial={false}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {visibleToasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={onDismiss}
            onPauseToast={onPauseToast}
            onResumeToast={onResumeToast}
            classNames={classNames}
            icons={icons}
            renderToast={renderToast}
          />
        ))}
      </AnimatePresence>
    </motion.ol>
  );

  if (typeof document === "undefined") {
    return null;
  }

  if (shouldPortal) {
    return createPortal(stack, portalRoot ?? document.body);
  }

  return stack;
}

const ToastItem = memo(function ToastItem({
  toast,
  onDismiss,
  onPauseToast,
  onResumeToast,
  classNames,
  icons,
  renderToast,
}: {
  toast: Toast;
  onDismiss?: (id: string) => void;
  onPauseToast?: (id: string) => void;
  onResumeToast?: (id: string) => void;
  classNames?: ToastClassNames;
  icons?: ToastIcons;
  renderToast?: (toast: Toast) => ReactNode;
}) {
  const reduce = Boolean(useReducedMotion());
  const status = toast.status ?? "neutral";
  const statusIcons = createStatusIcons(reduce);
  const canDismiss = toast.dismissible !== false && Boolean(onDismiss);
  const transition = reduce ? REDUCED_MOTION_TRANSITION : UI_SPRING;
  const initial = reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 };
  const animate = reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 };
  const exit = reduce
    ? { opacity: 0 }
    : {
        opacity: 0,
        x: 24,
        scale: 0.98,
        transition: { duration: 0.18, ease: EASE_OUT },
      };

  return (
    <motion.li
      layout
      className={cx("uk-toast__item", classNames?.item)}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      drag={canDismiss && !reduce ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragDirectionLock
      dragElastic={0.18}
      onDragEnd={(_, info) => {
        if (!canDismiss || !onDismiss) return;
        if (Math.abs(info.offset.x) > 72 || Math.abs(info.velocity.x) > 520) {
          onDismiss(toast.id);
        }
      }}
      onPointerEnter={() => onPauseToast?.(toast.id)}
      onPointerLeave={() => onResumeToast?.(toast.id)}
    >
      <div className={cx("uk-toast__surface", classNames?.surface)}>
        {renderToast ? renderToast(toast) : null}

        {!renderToast && (
          <div className="uk-toast__row">
            <span
              className={cx(
                "uk-toast__icon",
                `uk-toast__icon--${status}`,
                classNames?.iconWrap,
              )}
            >
              {icons?.[status] ?? statusIcons[status]}
            </span>

            <div className={cx("uk-toast__content", classNames?.content)}>
              <p className={cx("uk-toast__title", classNames?.title)}>
                {toast.title}
              </p>
              {toast.description ? (
                <p
                  className={cx(
                    "uk-toast__description",
                    classNames?.description,
                  )}
                >
                  {toast.description}
                </p>
              ) : null}

              {toast.action ? (
                <button
                  type="button"
                  className={cx("uk-toast__action", classNames?.action)}
                  onClick={() => toast.action?.onClick(toast)}
                >
                  {toast.action.label}
                </button>
              ) : null}
            </div>
          </div>
        )}

        {canDismiss ? (
          <button
            type="button"
            className={cx("uk-toast__close", classNames?.close)}
            aria-label="Dismiss notification"
            onClick={() => onDismiss?.(toast.id)}
          >
            <XIcon aria-hidden size={16} animateOnHover={!reduce} />
          </button>
        ) : null}
      </div>
    </motion.li>
  );
});
