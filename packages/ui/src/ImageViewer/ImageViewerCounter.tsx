import type { ComponentPropsWithRef, ReactElement } from "react";

import { cx } from "../utils/cx";
import { useImageViewerContext } from "./image-viewer-context";

export function ImageViewerCounter({
  className,
  ...props
}: ComponentPropsWithRef<"span">): ReactElement {
  const { index, images, t } = useImageViewerContext("ImageViewer.Counter");

  return (
    <span
      aria-live="polite"
      {...props}
      className={cx("uk-image-viewer__counter", className)}
    >
      {t("counter", { current: index + 1, total: images.length })}
    </span>
  );
}
