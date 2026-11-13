import type { ComponentPropsWithRef, ReactElement } from "react";

import { cx } from "../utils/cx";
import { useImageViewerContext } from "./image-viewer-context";

export function ImageViewerGallery({
  className,
  ...props
}: ComponentPropsWithRef<"section">): ReactElement {
  const { label } = useImageViewerContext("ImageViewer.Gallery");

  return (
    <section
      aria-label={label}
      {...props}
      className={cx("uk-image-viewer__gallery", className)}
    />
  );
}
