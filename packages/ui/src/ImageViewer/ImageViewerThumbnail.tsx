import { type HTMLMotionProps, motion } from "motion/react";
import { type MouseEvent, type ReactElement, type ReactNode } from "react";

import { EASE_OUT } from "../motion";
import { cx } from "../utils/cx";
import { useImageViewerContext } from "./image-viewer-context";

export interface ImageViewerThumbnailProps extends Omit<
  HTMLMotionProps<"button">,
  "children"
> {
  imageId: string;
  imageClassName?: string;
  children?: ReactNode;
}

/**
 * 打开灯箱的缩略图按钮。
 *
 * 图片本身不带共享布局身份、始终停留在网格原位；灯箱 frame 在打开 /
 * 关闭时从缩略图矩形浮出 / 缩回（复制的图片做大小动画），因此占位图
 * 不会在灯箱打开期间变成空白。
 */
export function ImageViewerThumbnail({
  imageId,
  className,
  imageClassName,
  children,
  onClick,
  disabled,
  ...props
}: ImageViewerThumbnailProps): ReactElement {
  const { images, value, reduce, select, t } = useImageViewerContext(
    "ImageViewer.Thumbnail",
  );
  const image = images.find((item) => item.id === imageId);

  if (!image) {
    throw new Error(`ImageViewer.Thumbnail: 未知的图片 id "${imageId}"。`);
  }

  return (
    <motion.button
      type="button"
      aria-label={t("open", { alt: image.alt })}
      aria-haspopup="dialog"
      aria-expanded={image.id === value}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.1, ease: EASE_OUT }}
      disabled={disabled}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);

        if (!event.defaultPrevented && !disabled) {
          select(image.id);
        }
      }}
      {...props}
      className={cx("uk-image-viewer__thumbnail", className)}
    >
      <img
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading="lazy"
        draggable={false}
        className={cx("uk-image-viewer__thumbnail-img", imageClassName)}
      />
      {children}
    </motion.button>
  );
}
