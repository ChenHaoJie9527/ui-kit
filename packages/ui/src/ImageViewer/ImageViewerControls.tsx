import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-animated";
import type { ComponentPropsWithRef, ReactElement } from "react";

import { cx } from "../utils/cx";
import {
  useImageViewerContext,
  type ImageViewerLabelKey,
} from "./image-viewer-context";

type ViewerControlProps = ComponentPropsWithRef<"button"> & {
  action: "close" | "previous" | "next";
};

function ViewerControl({
  action,
  className,
  children,
  disabled,
  onClick,
  ...props
}: ViewerControlProps): ReactElement {
  const { index, images, t, select, move } = useImageViewerContext(
    "ImageViewer 控制按钮",
  );

  const unavailable =
    action === "previous"
      ? index <= 0
      : action === "next"
        ? index < 0 || index >= images.length - 1
        : false;
  const Icon =
    action === "close"
      ? XIcon
      : action === "previous"
        ? ChevronLeftIcon
        : ChevronRightIcon;
  const label: ImageViewerLabelKey =
    action === "close" ? "close" : action === "previous" ? "previous" : "next";

  return (
    <button
      type="button"
      aria-label={t(label)}
      {...props}
      disabled={disabled || unavailable}
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented) {
          return;
        }

        if (action === "close") {
          select(null);
        } else {
          move(action === "previous" ? -1 : 1);
        }
      }}
      className={cx("uk-image-viewer__control", className)}
    >
      {children ?? <Icon size={18} aria-hidden="true" />}
    </button>
  );
}

export function ImageViewerClose(
  props: Omit<ViewerControlProps, "action">,
): ReactElement {
  return <ViewerControl {...props} action="close" />;
}

export function ImageViewerPrevious(
  props: Omit<ViewerControlProps, "action">,
): ReactElement {
  return <ViewerControl {...props} action="previous" />;
}

export function ImageViewerNext(
  props: Omit<ViewerControlProps, "action">,
): ReactElement {
  return <ViewerControl {...props} action="next" />;
}
