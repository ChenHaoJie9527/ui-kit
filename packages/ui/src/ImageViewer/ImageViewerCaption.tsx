import type { ComponentPropsWithRef, ReactElement } from "react";

import { cx } from "../utils/cx";
import { useImageViewerContext } from "./image-viewer-context";

export function ImageViewerCaption({
  className,
  children,
  ...props
}: ComponentPropsWithRef<"div">): ReactElement {
  const { image, renderCaption } = useImageViewerContext("ImageViewer.Caption");

  return (
    <div
      aria-live="polite"
      {...props}
      data-lightbox-content=""
      className={cx("uk-image-viewer__caption", className)}
    >
      {children ??
        (image
          ? renderCaption
            ? renderCaption(image)
            : (image.caption ?? image.alt)
          : null)}
    </div>
  );
}
