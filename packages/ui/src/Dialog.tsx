import {
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  useEventCallback,
  useFocusTrap,
  useLockBodyScroll,
} from "@momotom/hooks";
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
  /** 打开后优先聚焦的元素；不传则聚焦第一个可聚焦元素。 */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** 关闭后恢复焦点的元素；默认恢复到打开前的活动元素。 */
  returnFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  "aria-label"?: string;
}

const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * 模态对话框。
 *
 * 基于原生 <dialog> + showModal()：Esc 关闭、遮罩和顶层渲染由浏览器
 * 负责；焦点陷阱由 useFocusTrap 补上反向循环、外部聚焦回收与焦点恢复，
 * 组件本身额外提供受控开关、关闭按钮、遮罩点击与 body 滚动锁定。
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
  returnFocusRef,
  className,
  "aria-label": ariaLabel,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
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
      // 必须在 showModal() 之前记录，否则拿到的已经是对话框内部元素。
      openerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;

      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
  }, [open]);

  // 声明顺序很关键：上面的 effect 先调用 showModal()，本 hook 再接管焦点。
  useFocusTrap({
    active: open,
    containerRef: dialogRef,
    initialFocusRef,
    returnFocusRef: returnFocusRef ?? openerRef,
  });

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
