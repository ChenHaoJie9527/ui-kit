import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";

import { cx } from "../utils/cx";
import { ToastItem } from "./ToastItem";
import type { ToastStackProps } from "./toast-types";

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
            position={position}
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
