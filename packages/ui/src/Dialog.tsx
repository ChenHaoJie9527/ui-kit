import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import {
  animate,
  AnimatePresence,
  motion,
  MotionConfig,
  useDragControls,
  useIsPresent,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import { createPortal } from "react-dom";
import { useEventCallback, useFocusTrap, useLockBodyScroll } from "seam-hooks";
import { Button } from "./Button";
import { OVERLAY_SPRING, REDUCED_MOTION_TRANSITION } from "./motion";
import { cx } from "./utils/cx";

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
  /** 是否允许拖动关闭；默认仅在 Esc 和遮罩都可关闭时开启。 */
  dragToDismiss?: boolean;
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

interface DialogLayerProps extends DialogProps {
  requestClose: () => void;
}

function DialogLayer({
  requestClose,
  title,
  description,
  footer,
  children,
  closeLabel = "Close",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  dragToDismiss = closeOnEscape && closeOnBackdropClick,
  initialFocusRef,
  returnFocusRef,
  className,
  "aria-label": ariaLabel,
}: DialogLayerProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const isPresent = useIsPresent();
  const reduceMotion = useReducedMotion() ?? false;
  const dragControls = useDragControls();
  const dragY = useMotionValue(0);
  const canDrag = dragToDismiss && (closeOnEscape || closeOnBackdropClick);

  useLockBodyScroll(true);

  useMotionValueEvent(dragY, "change", (latest) => {
    const dialog = dialogRef.current;

    if (dialog) {
      dialog.style.setProperty(
        "--uk-dialog-drag-progress",
        String(Math.min(Math.max(latest, 0) / 160, 1)),
      );
    }
  });

  useLayoutEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    openerRef.current ??=
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (dialog.open) {
      return;
    }

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }, []);

  useFocusTrap({
    active: true,
    containerRef: dialogRef,
    initialFocusRef,
    returnFocusRef: returnFocusRef ?? openerRef,
  });

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const reopen = () => {
      if (dialog.open) {
        return;
      }

      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    };
    const onClose = () => {
      if (!closeOnEscape) {
        reopen();
        return;
      }

      requestClose();
    };
    const onCancel = (event: Event) => {
      event.preventDefault();

      if (closeOnEscape) {
        requestClose();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape || event.key !== "Escape" || event.defaultPrevented) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };
    const onClick = (event: MouseEvent) => {
      if (closeOnBackdropClick && event.target === dialog) {
        requestClose();
      }
    };

    dialog.addEventListener("close", onClose);
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("keydown", onKeyDown, true);
    dialog.addEventListener("click", onClick);

    return () => {
      dialog.removeEventListener("close", onClose);
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("keydown", onKeyDown, true);
      dialog.removeEventListener("click", onClick);
    };
  }, [closeOnBackdropClick, closeOnEscape, requestClose]);

  const onDragEnd = (_event: unknown, info: PanInfo) => {
    if (info.offset.y > 88 || info.velocity.y > 520) {
      requestClose();
      return;
    }

    animate(
      dragY,
      0,
      reduceMotion
        ? { duration: 0 }
        : {
            type: "spring",
            bounce: 0.08,
            duration: 0.4,
            velocity: info.velocity.y,
          },
    );
  };

  return (
    <dialog
      ref={dialogRef}
      className={cx("uk-dialog", className)}
      closedby={closeOnEscape || closeOnBackdropClick ? "any" : "none"}
      data-state={isPresent ? "open" : "closed"}
      data-drag-enabled={canDrag ? "true" : undefined}
      inert={!isPresent}
      aria-label={ariaLabel}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
    >
      <motion.div
        className="uk-dialog__drag-surface"
        drag={canDrag ? "y" : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: -12, bottom: 180 }}
        dragElastic={0.08}
        dragMomentum={false}
        onDragEnd={onDragEnd}
        style={{ y: dragY }}
      >
        <motion.div
          className="uk-dialog__panel"
          initial={
            reduceMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  transform: "translateY(12px) scale(0.96)",
                }
          }
          animate={{
            opacity: 1,
            transform: "translateY(0px) scale(1)",
            transition: reduceMotion
              ? REDUCED_MOTION_TRANSITION
              : { ...OVERLAY_SPRING, delay: 0.06 },
          }}
          exit={
            reduceMotion
              ? { opacity: 0, transition: REDUCED_MOTION_TRANSITION }
              : {
                  opacity: 0,
                  transform: "translateY(8px) scale(0.97)",
                  transition: OVERLAY_SPRING,
                }
          }
        >
          {canDrag ? (
            <div
              className="uk-dialog__drag-handle"
              aria-hidden="true"
              onPointerDown={(event) => {
                event.preventDefault();
                dragControls.start(event);
              }}
            >
              <span />
            </div>
          ) : null}

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
        </motion.div>
      </motion.div>
    </dialog>
  );
}

/**
 * 模态对话框。
 *
 * 基于原生 <dialog> 保留模态语义和 top layer。Motion 的 AnimatePresence
 * 负责退出阶段的 DOM 保留，MotionConfig 统一处理 reduced motion。
 */
export function Dialog(props: DialogProps): ReactElement | null {
  const { open, onOpenChange } = props;
  const requestClose = useEventCallback(() => {
    if (open) {
      onOpenChange(false);
    }
  });
  const isClient = useSyncExternalStore(
    subscribeToNothing,
    getClientSnapshot,
    getServerSnapshot,
  );

  if (!isClient) {
    return null;
  }

  return createPortal(
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open ? (
          <DialogLayer key="uk-dialog" {...props} requestClose={requestClose} />
        ) : null}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}
