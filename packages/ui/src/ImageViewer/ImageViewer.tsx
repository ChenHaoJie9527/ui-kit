import { type ReactElement, type ReactNode, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useControllableState, useEventCallback } from "seam-hooks";

import {
  ImageViewerContext,
  formatImageViewerLabel,
  imageViewerLabels,
  type ImageViewerContextValue,
  type ImageViewerImage,
  type ImageViewerLabelKey,
  type ImageViewerLabels,
  useImageViewerContext,
} from "./image-viewer-context";
import { ImageViewerCaption } from "./ImageViewerCaption";
import {
  ImageViewerClose,
  ImageViewerNext,
  ImageViewerPrevious,
} from "./ImageViewerControls";
import { ImageViewerContent } from "./ImageViewerContent";
import { ImageViewerCounter } from "./ImageViewerCounter";
import { ImageViewerGallery } from "./ImageViewerGallery";
import { ImageViewerThumbnail } from "./ImageViewerThumbnail";

export interface ImageViewerProps {
  images: ImageViewerImage[];
  /** 受控选中图片 id；null 表示关闭。 */
  value?: string | null;
  /** 非受控模式下的初始选中 id。 */
  defaultValue?: string | null;
  /** 选中变化时触发，受控与非受控都会回调。 */
  onValueChange?: (id: string | null) => void;
  /** 画廊与灯箱的可访问名称。 */
  label?: string;
  /** 默认画廊布局的容器类名。 */
  className?: string;
  /** 默认画廊里所有缩略图的类名。 */
  thumbnailClassName?: string;
  /** 自定义灯箱说明文字的渲染。 */
  renderCaption?: (image: ImageViewerImage) => ReactNode;
  /** 自定义画廊与灯箱组合；省略时使用默认布局。 */
  children?: ReactNode;
  /** 覆盖内置文案。 */
  labels?: Partial<ImageViewerLabels>;
}

/**
 * 图片画廊 + 形态变换灯箱。
 *
 * 缩略图保持原位，灯箱 frame 从缩略图矩形复制浮出（大小动画），
 * 支持方向键 / 触控滑动切换、计数与说明、2x 缩放与平移，关闭时
 * 复制图缩回缩略图位置平滑消失。模态语义由原生 `<dialog>` 承载，
 * 焦点圈闭与滚动锁复用 seam-hooks。
 */
function ImageViewerRoot({
  images,
  value: controlledValue,
  defaultValue = null,
  onValueChange,
  label: labelProp,
  className,
  thumbnailClassName,
  renderCaption,
  children,
  labels,
}: ImageViewerProps): ReactElement {
  const reduce = useReducedMotion() ?? false;
  // 实例级缩略图注册表：每个 ImageViewer 只认自己的缩略图，多个实例
  // 共用相同图片 src 时不会串到别的实例的缩略图。
  // 实例级缩略图注册表：每个 ImageViewer 只认自己的缩略图，多个实例
  // 共用相同图片 src 时不会串到别的实例的缩略图。useState 惰性初始化，
  // 引用在生命周期内稳定。
  const [thumbnails] = useState(() => new Map<string, HTMLImageElement>());
  const resolvedLabels = useMemo<ImageViewerLabels>(
    () => ({ ...imageViewerLabels, ...labels }),
    [labels],
  );
  const [value, setValue] = useControllableState<string | null>({
    value: controlledValue,
    defaultValue,
    onChange: onValueChange,
  });

  // 数据校验：形变依赖每个图片唯一的 id 与可用的宽高比。
  if (new Set(images.map((item) => item.id)).size !== images.length) {
    throw new Error("ImageViewer 要求图片 id 唯一。");
  }

  if (
    images.some(
      (item) =>
        !Number.isFinite(item.width) ||
        !Number.isFinite(item.height) ||
        item.width <= 0 ||
        item.height <= 0,
    )
  ) {
    throw new Error("ImageViewer 要求 width / height 为正数。");
  }

  const index = images.findIndex((item) => item.id === value);
  const image = images[index] ?? undefined;

  // 非受控模式：引用已移除的 id 时回落到关闭，避免重加图片复活旧会话。
  if (controlledValue === undefined && value !== null && index < 0) {
    setValue(null);
  }

  const select = useEventCallback((id: string | null) => {
    setValue(id);
  });
  const move = useEventCallback((direction: -1 | 1) => {
    const next = images[index + direction];

    if (image && next) {
      select(next.id);
    }
  });
  const t = useEventCallback(
    (key: ImageViewerLabelKey, values?: Record<string, string | number>) =>
      formatImageViewerLabel(resolvedLabels[key], values),
  );

  const contextValue = useMemo<ImageViewerContextValue>(
    () => ({
      images,
      value,
      index,
      image,
      label: labelProp ?? resolvedLabels.label,
      reduce,
      labels: resolvedLabels,
      thumbnails,
      renderCaption,
      select,
      move,
      t,
    }),
    [
      images,
      value,
      index,
      image,
      labelProp,
      resolvedLabels,
      reduce,
      thumbnails,
      renderCaption,
      select,
      move,
      t,
    ],
  );

  return (
    <ImageViewerContext.Provider value={contextValue}>
      {children === undefined ? (
        <>
          <ImageViewerGallery className={className}>
            {images.map((item) => (
              <ImageViewerThumbnail
                key={item.id}
                imageId={item.id}
                className={thumbnailClassName}
              />
            ))}
          </ImageViewerGallery>
          <ImageViewerContent />
        </>
      ) : (
        children
      )}
    </ImageViewerContext.Provider>
  );
}

/** 供自定义画廊 / 自定义控件读取选中状态。 */
export function useImageViewer() {
  const { images, value, image, index, select, move } =
    useImageViewerContext("useImageViewer");

  return {
    images,
    value,
    image,
    index,
    hasPrevious: index > 0,
    hasNext: index >= 0 && index < images.length - 1,
    select,
    close: () => select(null),
    previous: () => move(-1),
    next: () => move(1),
  };
}

export interface ImageViewerComponent {
  (props: ImageViewerProps): ReactElement;
  Gallery: typeof ImageViewerGallery;
  Thumbnail: typeof ImageViewerThumbnail;
  Content: typeof ImageViewerContent;
  Counter: typeof ImageViewerCounter;
  Caption: typeof ImageViewerCaption;
  Close: typeof ImageViewerClose;
  Previous: typeof ImageViewerPrevious;
  Next: typeof ImageViewerNext;
}

/** 组合式 API：Root 即 ImageViewer，语义部件挂在命名空间下。 */
export const ImageViewer: ImageViewerComponent = Object.assign(
  ImageViewerRoot,
  {
    Gallery: ImageViewerGallery,
    Thumbnail: ImageViewerThumbnail,
    Content: ImageViewerContent,
    Counter: ImageViewerCounter,
    Caption: ImageViewerCaption,
    Close: ImageViewerClose,
    Previous: ImageViewerPrevious,
    Next: ImageViewerNext,
  },
);
