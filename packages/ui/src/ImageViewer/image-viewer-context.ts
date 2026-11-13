import { createContext, useContext } from "react";

/** 图片数据：尺寸必填，用于保持形变过程中的宽高比。 */
export interface ImageViewerImage {
  id: string;
  src: string;
  alt: string;
  /** 图片固有尺寸，宽高比在缩略图与灯箱形变中保持一致。 */
  width: number;
  height: number;
  /** 灯箱中的说明文字；缺省时回退到 alt。 */
  caption?: string;
}

/** 内置文案，实例可通过 labels prop 覆盖。 */
export const imageViewerLabels = {
  label: "图片画廊",
  open: "打开图片 {alt}",
  counter: "{current} / {total}",
  close: "关闭查看器",
  previous: "上一张图片",
  next: "下一张图片",
  loadError: "图片加载失败，无法显示。",
  zoomIn: "放大图片",
  zoomOut: "缩小图片",
  panHelp: "放大后可以拖动图片平移，或保持此按钮聚焦并使用方向键移动。",
};

export type ImageViewerLabels = typeof imageViewerLabels;

export type ImageViewerLabelKey = keyof ImageViewerLabels;

/** 插值 `{name}` 占位符；缺值保留原样。 */
export function formatImageViewerLabel(
  template: string,
  values?: Record<string, string | number>,
): string {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = values[name];

    return value === undefined ? match : String(value);
  });
}

export interface ImageViewerContextValue {
  images: ImageViewerImage[];
  value: string | null;
  index: number;
  image: ImageViewerImage | undefined;
  label: string;
  reduce: boolean;
  labels: ImageViewerLabels;
  /** 当前实例的缩略图注册表（imageId → img 元素），供灯箱测量弹出原点。 */
  thumbnails: Map<string, HTMLImageElement>;
  renderCaption?: (image: ImageViewerImage) => React.ReactNode;
  select: (id: string | null) => void;
  move: (direction: -1 | 1) => void;
  t: (
    key: ImageViewerLabelKey,
    values?: Record<string, string | number>,
  ) => string;
}

export const ImageViewerContext = createContext<ImageViewerContextValue | null>(
  null,
);

export function useImageViewerContext(
  component: string,
): ImageViewerContextValue {
  const context = useContext(ImageViewerContext);

  if (!context) {
    throw new Error(`<${component}> 必须在 <ImageViewer> 内部使用`);
  }

  return context;
}

export const subscribeToNothing = () => () => {};
export const getClientSnapshot = () => true;
export const getServerSnapshot = () => false;
