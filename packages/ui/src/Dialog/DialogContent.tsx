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

import { OVERLAY_SPRING, REDUCED_MOTION_TRANSITION } from "../motion";
import { cx } from "../utils/cx";
import {
  getClientSnapshot,
  getServerSnapshot,
  subscribeToNothing,
  useDialogContext,
} from "./dialog-context";

export interface DialogContentProps {
  children?: ReactNode;
  className?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

interface DialogLayerProps extends DialogContentProps {
  requestClose: () => void;
  contentId: string;
  titleId: string;
  descriptionId: string;
  hasTitle: boolean;
  hasDescription: boolean;
}

export function DialogLayer({
  requestClose,
  contentId,
  titleId,
  descriptionId,
  hasTitle,
  hasDescription,
  children,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  initialFocusRef,
  returnFocusRef,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: DialogLayerProps): ReactElement {
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
      className={cx("uk-dialog", className)}
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
        {children}
      </motion.div>
    </dialog>
  );
}

export function DialogContent({
  children,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  initialFocusRef,
  returnFocusRef,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: DialogContentProps): ReactElement | null {
  const context = useDialogContext("Dialog.Content");
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
          <DialogLayer
            key="uk-dialog"
            requestClose={requestClose}
            contentId={context.contentId}
            titleId={context.titleId}
            descriptionId={context.descriptionId}
            hasTitle={context.hasTitle}
            hasDescription={context.hasDescription}
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
          </DialogLayer>
        ) : null}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}
