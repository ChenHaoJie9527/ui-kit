import {
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useEventCallback, useLockBodyScroll } from "@ui-kit/hooks";
import { Button } from "./Button";
import { cx } from "./utils/cx";
import "./dialog.css";

export interface DialogProps {
  /** 是否打开。由调用方控制，配合 onOpenChange 使用。 */
  open: boolean;
  /** 打开状态变化时触发，用于同步外部 state。 */
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  /** 关闭按钮的无障碍名称，默认 Close。 */
  closeLabel?: string;
  showCloseButton?: boolean;
  /** 点击遮罩是否关闭，默认 true。 */
  closeOnBackdropClick?: boolean;
  /** 按 Esc 是否关闭，默认 true。 */
  closeOnEscape?: boolean;
  /** 打开后优先聚焦的元素；不传则使用浏览器默认行为。 */
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  "aria-label"?: string;
}

const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * 模态对话框。
 *
 * 基于原生 <dialog> + showModal()：焦点陷阱、Esc 关闭、遮罩和
 * 顶层渲染都由浏览器负责；组件额外提供受控开关、关闭按钮、遮罩点击
 * 与 body 滚动锁定。
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  closeLabel = "Close",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  initialFocusRef,
  className,
  "aria-label": ariaLabel,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openRef = useRef(open);
  const titleId = useId();
  const descriptionId = useId();
  const isClient = useSyncExternalStore(
    subscribeToNothing,
    getClientSnapshot,
    getServerSnapshot,
  );

  const requestClose = useEventCallback(() => {
    if (openRef.current) {
      onOpenChange(false);
    }
  });

  useLockBodyScroll(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }

      initialFocusRef?.current?.focus();
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
  }, [initialFocusRef, open]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const onClose = () => requestClose();
    const onCancel = (event: Event) => {
      if (!closeOnEscape) {
        event.preventDefault();
      }
    };
    const onClick = (event: MouseEvent) => {
      if (closeOnBackdropClick && event.target === dialog) {
        requestClose();
      }
    };

    dialog.addEventListener("close", onClose);
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("click", onClick);

    return () => {
      dialog.removeEventListener("close", onClose);
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("click", onClick);
    };
  }, [closeOnBackdropClick, closeOnEscape, requestClose]);

  if (!isClient) {
    return null;
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className={cx("uk-dialog", className)}
      aria-label={ariaLabel}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
    >
      <div className="uk-dialog__panel">
        {title || description || showCloseButton ? (
          <header className="uk-dialog__header">
            <div className="uk-dialog__heading">
              {title ? (
                <h2 id={titleId} className="uk-dialog__title">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p id={descriptionId} className="uk-dialog__description">
                  {description}
                </p>
              ) : null}
            </div>
            {showCloseButton ? (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                aria-label={closeLabel}
                className="uk-dialog__close"
                onClick={requestClose}
              >
                <svg
                  viewBox="0 0 20 20"
                  width="16"
                  height="16"
                  aria-hidden="true"
                >
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </Button>
            ) : null}
          </header>
        ) : null}

        <div className="uk-dialog__body">{children}</div>

        {footer ? (
          <footer className="uk-dialog__footer">{footer}</footer>
        ) : null}
      </div>
    </dialog>,
    document.body,
  );
}
