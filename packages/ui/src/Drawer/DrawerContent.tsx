import { useEventCallback, useFocusTrap, useLockBodyScroll } from "seam-hooks";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import {
  DRAWER_ENTER_TRANSITION,
  DRAWER_EXIT_TRANSITION,
  REDUCED_MOTION_TRANSITION,
} from "../motion";
import { cx } from "../utils/cx";
import {
  getClientSnapshot,
  getServerSnapshot,
  subscribeToNothing,
  useDrawerContext,
} from "./drawer-context";
import type { DrawerSide, DrawerSize } from "./DrawerRoot";

export interface DrawerContentProps {
  children?: ReactNode;
  className?: string;
  /** 从哪一侧滑入，默认 right。 */
  side?: DrawerSide;
  /** 面板宽度，默认 md。 */
  size?: DrawerSize;
  /** 点击遮罩是否关闭，默认 true。 */
  closeOnBackdropClick?: boolean;
  /** 按 Esc 是否关闭，默认 true。 */
  closeOnEscape?: boolean;
  /** 打开后优先聚焦的元素；不传则聚焦第一个可聚焦元素。 */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** 关闭后恢复焦点的元素；默认恢复到打开前的活动元素。 */
  returnFocusRef?: RefObject<HTMLElement | null>;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

interface DrawerLayerProps extends DrawerContentProps {
  requestClose: () => void;
  contentId: string;
  titleId: string;
  descriptionId: string;
  hasTitle: boolean;
  hasDescription: boolean;
}

export function DrawerLayer({
  requestClose,
  contentId,
  titleId,
  descriptionId,
  hasTitle,
  hasDescription,
  children,
  side = "right",
  size = "md",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  initialFocusRef,
  returnFocusRef,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: DrawerLayerProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const isPresent = useIsPresent();
  const reduceMotion = useReducedMotion() ?? false;

  useLockBodyScroll(true);

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
    const onClick = (event: globalThis.MouseEvent) => {
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

  const offscreen = side === "right" ? "100%" : "-100%";
  // Native light dismiss follows the same split as our own handlers: Escape only
  // when backdrop closing is off, and no native dismissal at all when Escape is
  // disabled (backdrop clicks still run through the dialog click handler).
  const closedBy = !closeOnEscape
    ? "none"
    : closeOnBackdropClick
      ? "any"
      : "closerequest";

  return (
    <dialog
      ref={dialogRef}
      id={contentId}
      className="uk-drawer"
      closedby={closedBy}
      data-state={isPresent ? "open" : "closed"}
      inert={!isPresent}
      aria-label={ariaLabel}
      aria-labelledby={
        ariaLabelledBy ??
        (ariaLabel ? undefined : hasTitle ? titleId : undefined)
      }
      aria-describedby={
        ariaDescribedBy ?? (hasDescription ? descriptionId : undefined)
      }
    >
      <motion.div
        className={cx("uk-drawer__panel", className)}
        data-side={side}
        data-size={size}
        // Same-edge slide: right starts fully off-screen right (x: 100%) and
        // travels left; left starts at x: -100% and travels right. No opacity
        // fade — fading would read as appearing in place, not travelling.
        initial={reduceMotion ? { opacity: 0 } : { x: offscreen }}
        animate={
          reduceMotion
            ? { opacity: 1, transition: REDUCED_MOTION_TRANSITION }
            : { x: 0, transition: DRAWER_ENTER_TRANSITION }
        }
        exit={
          reduceMotion
            ? { opacity: 0, transition: REDUCED_MOTION_TRANSITION }
            : { x: offscreen, transition: DRAWER_EXIT_TRANSITION }
        }
      >
        {children}
      </motion.div>
    </dialog>
  );
}

/** Portal、原生 dialog、焦点与 presence 生命周期的语义层。 */
export function DrawerContent({
  children,
  side = "right",
  size = "md",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  initialFocusRef,
  returnFocusRef,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: DrawerContentProps): ReactElement | null {
  const context = useDrawerContext("Drawer.Content");
  const requestClose = useEventCallback(() => {
    context.setOpen(false);
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
        {context.open ? (
          <DrawerLayer
            key="uk-drawer"
            requestClose={requestClose}
            contentId={context.contentId}
            titleId={context.titleId}
            descriptionId={context.descriptionId}
            hasTitle={context.hasTitle}
            hasDescription={context.hasDescription}
            side={side}
            size={size}
            closeOnBackdropClick={closeOnBackdropClick}
            closeOnEscape={closeOnEscape}
            initialFocusRef={initialFocusRef}
            returnFocusRef={returnFocusRef}
            className={className}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
          >
            {children}
          </DrawerLayer>
        ) : null}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}
