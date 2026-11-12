import {
  CircleCheckBigIcon,
  CircleHelpIcon,
  LoaderCircleIcon,
  MessageCircleIcon,
  MessageCircleXIcon,
  type LoaderCircleIconHandle,
} from "lucide-animated";
import { memo, useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { XIcon } from "lucide-animated";

import { EASE_OUT, REDUCED_MOTION_TRANSITION, UI_SPRING } from "../motion";
import { cx } from "../utils/cx";
import type {
  Toast,
  ToastClassNames,
  ToastIcons,
  ToastStatus,
} from "./toast-types";

function StatusIcon({
  status,
  reducedMotion,
}: {
  status: ToastStatus;
  reducedMotion: boolean;
}) {
  const iconRef = useRef<LoaderCircleIconHandle>(null);

  useEffect(() => {
    if (reducedMotion) {
      iconRef.current?.stopAnimation();
      return;
    }

    iconRef.current?.startAnimation();
  }, [reducedMotion]);

  const iconProps = {
    ref: iconRef,
    "aria-hidden": true,
    size: 16,
    animateOnHover: false,
  } as const;

  switch (status) {
    case "neutral":
      return <MessageCircleIcon {...iconProps} />;
    case "info":
      return <CircleHelpIcon {...iconProps} />;
    case "loading":
      return <LoaderCircleIcon {...iconProps} />;
    case "success":
      return <CircleCheckBigIcon {...iconProps} />;
    case "error":
      return <MessageCircleXIcon {...iconProps} />;
  }
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
      onPointerEnter={() => {
        onPauseToast?.(toast.id);
      }}
      onPointerLeave={() => {
        onResumeToast?.(toast.id);
      }}
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
              {icons?.[status] ?? (
                <StatusIcon
                  key={status}
                  status={status}
                  reducedMotion={reduce}
                />
              )}
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

export { ToastItem };
