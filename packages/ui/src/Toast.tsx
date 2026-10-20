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
import { createPortal } from "react-dom";

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
  /** 提示区域的屏幕阅读器名称。 */
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
  leaving: boolean;
}

interface ToastViewProps {
  record: ToastRecord;
  closeLabel: string;
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const EXIT_DURATION = 200;

const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function ToastView({
  record,
  closeLabel,
  onDismiss,
  onPause,
  onResume,
}: ToastViewProps) {
  return (
    <div
      className="uk-toast"
      data-variant={record.variant}
      data-state={record.leaving ? "closed" : "open"}
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
    </div>
  );
}

/**
 * Toast 上下文。
 *
 * 负责队列、自动关闭、悬停/聚焦暂停、退出动画和 portal 渲染。
 * 必须包在应用外层，子组件通过 useToast() 获取 toast()。
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
  const exitTimersRef = useRef(
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

  const clearExitTimer = useCallback((id: string) => {
    const timer = exitTimersRef.current.get(id);

    if (timer !== undefined) {
      clearTimeout(timer);
      exitTimersRef.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      clearAutoTimer(id);

      if (exitTimersRef.current.has(id)) {
        return;
      }

      const exists = recordsRef.current.some((record) => record.id === id);

      if (!exists) {
        return;
      }

      commit(
        recordsRef.current.map((record) =>
          record.id === id ? { ...record, leaving: true } : record,
        ),
      );

      exitTimersRef.current.set(
        id,
        setTimeout(() => {
          exitTimersRef.current.delete(id);
          durationsRef.current.delete(id);
          commit(recordsRef.current.filter((record) => record.id !== id));
        }, EXIT_DURATION),
      );
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
        leaving: false,
      };

      const next = [...recordsRef.current, record];
      const overflow = Math.max(0, next.length - maxToasts);
      const dropped = overflow > 0 ? next.slice(0, overflow) : [];

      dropped.forEach((item) => {
        clearAutoTimer(item.id);
        clearExitTimer(item.id);
        durationsRef.current.delete(item.id);
      });

      const kept = overflow > 0 ? next.slice(overflow) : next;

      durationsRef.current.set(id, record.duration);
      commit(kept);
      scheduleAutoDismiss(id, record.duration);

      return id;
    },
    [
      baseId,
      clearAutoTimer,
      clearExitTimer,
      commit,
      duration,
      maxToasts,
      scheduleAutoDismiss,
    ],
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
    recordsRef.current.forEach((record) => dismiss(record.id));
  }, [dismiss]);

  const api = useMemo<ToastApi>(
    () => ({ toast, dismiss, dismissAll }),
    [dismiss, dismissAll, toast],
  );

  useEffect(() => {
    const autoTimers = autoTimersRef.current;
    const exitTimers = exitTimersRef.current;

    return () => {
      autoTimers.forEach((timer) => clearTimeout(timer));
      exitTimers.forEach((timer) => clearTimeout(timer));
      autoTimers.clear();
      exitTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {isClient
        ? createPortal(
            <section
              className="uk-toast-viewport"
              data-placement={placement}
              aria-label={label}
              aria-live="polite"
              aria-atomic="false"
            >
              {records.map((record) => (
                <ToastView
                  key={record.id}
                  record={record}
                  closeLabel={closeLabel}
                  onDismiss={dismiss}
                  onPause={pause}
                  onResume={resume}
                />
              ))}
            </section>,
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
