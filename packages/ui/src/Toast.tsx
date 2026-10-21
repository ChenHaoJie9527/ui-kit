import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { createPortal } from "react-dom";
import { REDUCED_MOTION_TRANSITION, TOAST_SPRING } from "./motion";

export type ToastVariant = "info" | "success" | "warning" | "danger";

export type ToastPlacement =
  | "top-right"
  | "top-center"
  | "bottom-right"
  | "bottom-center";

export interface ToastOptions {
  title?: ReactNode;
  description?: ReactNode;
  /** 视觉变体，默认 info。 */
  variant?: ToastVariant;
  /** 自动关闭时间（毫秒），0 表示常驻；默认取 Provider 配置。 */
  duration?: number;
}

export interface ToastApi {
  /** 弹出一条提示，返回其 id。 */
  toast: (options: ToastOptions) => string;
  /** 关闭指定提示。 */
  dismiss: (id: string) => void;
  /** 关闭当前所有提示。 */
  dismissAll: () => void;
}

export interface ToastProviderProps {
  children: ReactNode;
  /** 提示出现的位置，默认 top-right。 */
  placement?: ToastPlacement;
  /** 默认自动关闭时间，默认 4000ms。 */
  duration?: number;
  /** 同屏最多保留的提示数量，默认 4。 */
  maxToasts?: number;
  /** 提示区域的屏幕阅读器名称，默认 Notifications。 */
  label?: string;
  /** 关闭按钮的无障碍名称，默认 Close。 */
  closeLabel?: string;
}

interface ToastRecord {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  variant: ToastVariant;
  duration: number;
}

interface ToastViewProps {
  record: ToastRecord;
  placement: ToastPlacement;
  closeLabel: string;
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function ToastView({
  record,
  placement,
  closeLabel,
  onDismiss,
  onPause,
  onResume,
}: ToastViewProps) {
  const isPresent = useIsPresent();
  const reduceMotion = useReducedMotion() ?? false;
  const enterY = placement.startsWith("top") ? -10 : 10;

  return (
    <motion.div
      className="uk-toast"
      data-variant={record.variant}
      data-state={isPresent ? "open" : "closed"}
      inert={!isPresent}
      layout={!reduceMotion}
      initial={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, transform: `translateY(${enterY}px) scale(0.98)` }
      }
      animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
      exit={
        reduceMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              transform: `translateY(${enterY / 2}px) scale(0.98)`,
            }
      }
      transition={reduceMotion ? REDUCED_MOTION_TRANSITION : TOAST_SPRING}
      onMouseEnter={() => onPause(record.id)}
      onMouseLeave={() => onResume(record.id)}
      onFocusCapture={() => onPause(record.id)}
      onBlurCapture={() => onResume(record.id)}
    >
      <div className="uk-toast__body">
        {record.title ? (
          <div className="uk-toast__title">{record.title}</div>
        ) : null}
        {record.description ? (
          <div className="uk-toast__description">{record.description}</div>
        ) : null}
      </div>
      <button
        type="button"
        className="uk-toast__close"
        aria-label={closeLabel}
        onClick={() => onDismiss(record.id)}
      >
        <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
          <path
            d="M5 5l10 10M15 5L5 15"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </motion.div>
  );
}

/**
 * Toast 上下文。
 *
 * 负责队列、自动关闭、悬停/聚焦暂停与 portal 渲染。退出阶段由
 * AnimatePresence 保留，因此删除状态后仍能完成动画。
 */
export function ToastProvider({
  children,
  placement = "top-right",
  duration = 4000,
  maxToasts = 4,
  label = "Notifications",
  closeLabel = "Close",
}: ToastProviderProps): ReactElement {
  const [records, setRecords] = useState<ToastRecord[]>([]);
  const recordsRef = useRef<ToastRecord[]>([]);
  const durationsRef = useRef(new Map<string, number>());
  const autoTimersRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );
  const counterRef = useRef(0);
  const baseId = useId();
  const isClient = useSyncExternalStore(
    subscribeToNothing,
    getClientSnapshot,
    getServerSnapshot,
  );

  const commit = useCallback((next: ToastRecord[]) => {
    recordsRef.current = next;
    setRecords(next);
  }, []);

  const clearAutoTimer = useCallback((id: string) => {
    const timer = autoTimersRef.current.get(id);

    if (timer !== undefined) {
      clearTimeout(timer);
      autoTimersRef.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      clearAutoTimer(id);

      if (!recordsRef.current.some((record) => record.id === id)) {
        return;
      }

      durationsRef.current.delete(id);
      commit(recordsRef.current.filter((record) => record.id !== id));
    },
    [clearAutoTimer, commit],
  );

  const scheduleAutoDismiss = useCallback(
    (id: string, delay: number) => {
      clearAutoTimer(id);

      if (delay <= 0) {
        return;
      }

      autoTimersRef.current.set(
        id,
        setTimeout(() => {
          autoTimersRef.current.delete(id);
          dismiss(id);
        }, delay),
      );
    },
    [clearAutoTimer, dismiss],
  );

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = `${baseId}-${counterRef.current}`;
      counterRef.current += 1;

      const record: ToastRecord = {
        id,
        title: options.title,
        description: options.description,
        variant: options.variant ?? "info",
        duration: options.duration ?? duration,
      };

      const next = [...recordsRef.current, record];
      const overflow = Math.max(0, next.length - maxToasts);
      const dropped = overflow > 0 ? next.slice(0, overflow) : [];

      dropped.forEach((item) => {
        clearAutoTimer(item.id);
        durationsRef.current.delete(item.id);
      });

      const kept = overflow > 0 ? next.slice(overflow) : next;

      durationsRef.current.set(id, record.duration);
      commit(kept);
      scheduleAutoDismiss(id, record.duration);

      return id;
    },
    [baseId, clearAutoTimer, commit, duration, maxToasts, scheduleAutoDismiss],
  );

  const pause = useCallback(
    (id: string) => {
      clearAutoTimer(id);
    },
    [clearAutoTimer],
  );

  const resume = useCallback(
    (id: string) => {
      const delay = durationsRef.current.get(id);

      if (delay !== undefined) {
        scheduleAutoDismiss(id, delay);
      }
    },
    [scheduleAutoDismiss],
  );

  const dismissAll = useCallback(() => {
    recordsRef.current.forEach((record) => clearAutoTimer(record.id));
    durationsRef.current.clear();
    commit([]);
  }, [clearAutoTimer, commit]);

  const api = useMemo<ToastApi>(
    () => ({ toast, dismiss, dismissAll }),
    [dismiss, dismissAll, toast],
  );

  useEffect(() => {
    const autoTimers = autoTimersRef.current;

    return () => {
      autoTimers.forEach((timer) => clearTimeout(timer));
      autoTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {isClient
        ? createPortal(
            <MotionConfig reducedMotion="user">
              <section
                className="uk-toast-viewport"
                data-placement={placement}
                aria-label={label}
                aria-live="polite"
                aria-atomic="false"
              >
                <AnimatePresence initial={false}>
                  {records.map((record) => (
                    <ToastView
                      key={record.id}
                      record={record}
                      placement={placement}
                      closeLabel={closeLabel}
                      onDismiss={dismiss}
                      onPause={pause}
                      onResume={resume}
                    />
                  ))}
                </AnimatePresence>
              </section>
            </MotionConfig>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

/**
 * 获取 toast API。必须在 <ToastProvider> 内使用。
 */
export function useToast(): ToastApi {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within <ToastProvider>");
  }

  return context;
}
