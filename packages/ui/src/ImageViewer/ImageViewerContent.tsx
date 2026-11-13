import { MinimizeIcon, PlusIcon } from "lucide-animated";
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useIsPresent,
  useMotionValue,
  type Variants,
} from "motion/react";
import {
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { useEventCallback, useFocusTrap, useLockBodyScroll } from "seam-hooks";

import { EASE_OUT, REDUCED_MOTION_TRANSITION } from "../motion";
import { cx } from "../utils/cx";
import {
  getClientSnapshot,
  getServerSnapshot,
  subscribeToNothing,
  useImageViewerContext,
  type ImageViewerImage,
} from "./image-viewer-context";
import {
  IMAGE_VIEWER_CLOSE_SHRINK,
  IMAGE_VIEWER_LAYOUT_SPRING,
  IMAGE_VIEWER_SLIDE_TRANSITION,
} from "./image-viewer-motion";
import { ImageViewerCaption } from "./ImageViewerCaption";
import {
  ImageViewerClose,
  ImageViewerNext,
  ImageViewerPrevious,
} from "./ImageViewerControls";
import { ImageViewerCounter } from "./ImageViewerCounter";

export interface ImageViewerContentProps {
  className?: string;
  /** 自定义顶部栏；默认是计数与关闭控件。 */
  header?: ReactNode;
  /** 自定义底部栏；默认是导航与图片说明。 */
  children?: ReactNode;
}

type ImageSwap = { direction: -1 | 1; reduce: boolean };

const imageSwapVariants: Variants = {
  enter: ({ direction, reduce }: ImageSwap) => ({
    opacity: reduce ? 0 : 1,
    x: `${reduce ? 0 : direction * 100}%`,
  }),
  visible: ({ reduce }: ImageSwap) => ({
    opacity: 1,
    x: "0%",
    transition: reduce
      ? REDUCED_MOTION_TRANSITION
      : IMAGE_VIEWER_SLIDE_TRANSITION,
  }),
  exit: ({ direction, reduce }: ImageSwap) => ({
    opacity: reduce ? 0 : 1,
    x: `${reduce ? 0 : direction * -100}%`,
    transition: reduce
      ? REDUCED_MOTION_TRANSITION
      : IMAGE_VIEWER_SLIDE_TRANSITION,
  }),
};

/**
 * 灯箱：Portal + 原生 `<dialog>` 模态层。
 *
 * 打开时共享布局形变（frame 与缩略图的 layoutId 配对），关闭时 frame
 * 退出动画结束后卸载，缩略图承接反向形变；遮罩淡出由 dialog 的
 * ::backdrop CSS 过渡完成，因此层必须保持挂载到退出动画结束。
 */
export function ImageViewerContent({
  className,
  header,
  children,
}: ImageViewerContentProps): ReactElement | null {
  const context = useImageViewerContext("ImageViewer.Content");
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
        {context.image ? (
          <ImageViewerLayer
            key="uk-image-viewer"
            className={className}
            header={header}
          >
            {children}
          </ImageViewerLayer>
        ) : null}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}

function ImageViewerLayer({
  className,
  header,
  children,
}: ImageViewerContentProps): ReactElement {
  const context = useImageViewerContext("ImageViewer.Content");
  const { images, label, reduce, select, move } = context;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const isPresent = useIsPresent();

  // 导航时跟随当前图片；退出期间 context 的 image 已变回 undefined，
  // AnimatePresence 仍把层保留在树上渲染退出动画，这里冻结最后一张图，
  // 避免 dialog 内容在退出开始时被清空。
  const [frozenImage, setFrozenImage] = useState(context.image);

  if (context.image && context.image !== frozenImage) {
    setFrozenImage(context.image);
  }

  const image = context.image ?? frozenImage;
  const index = image ? images.findIndex((item) => item.id === image.id) : -1;

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

  const requestClose = useEventCallback(() => {
    select(null);
  });

  useFocusTrap({
    active: true,
    containerRef: dialogRef,
    returnFocusRef: openerRef,
  });

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    // Esc 与背板点击统一走一次关闭请求；原生关闭被阻止，退出动画期间
    // dialog 保持挂载，直到 AnimatePresence 卸载。
    const onCancel = (event: Event) => {
      event.preventDefault();
      requestClose();
    };
    const onClick = (event: globalThis.MouseEvent) => {
      if (event.target === dialog) {
        requestClose();
      }
    };

    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("click", onClick);

    return () => {
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("click", onClick);
    };
  }, [requestClose]);

  // 层仅在灯箱打开时挂载；此处仅在从未有图片时触发，用于类型收窄。
  if (!image) {
    return <></>;
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      data-state={isPresent ? "open" : "closed"}
      inert={!isPresent}
      closedby="closerequest"
      onKeyDown={(event) => {
        if (
          (event.target instanceof Element &&
            event.target.closest(
              'input, textarea, select, [contenteditable="true"]',
            )) ||
          event.defaultPrevented ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        ) {
          return;
        }

        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
      className={cx("uk-image-viewer", className)}
    >
      <motion.div
        className="uk-image-viewer__panel"
        initial={reduce ? { opacity: 0 } : { opacity: 1 }}
        animate={
          reduce
            ? { opacity: 1, transition: REDUCED_MOTION_TRANSITION }
            : { opacity: 1 }
        }
        exit={{
          opacity: 0,
          transition: reduce
            ? REDUCED_MOTION_TRANSITION
            : { delay: 0.18, duration: 0.14, ease: EASE_OUT },
        }}
        onPointerDownCapture={(event) => {
          const target = event.target;

          if (
            target instanceof Element &&
            !target.closest(
              "button, a, input, select, textarea, [data-lightbox-content]",
            )
          ) {
            // 点按灯箱空白处关闭；图片与说明文字不受影响。
            event.preventDefault();
            select(null);
          }
        }}
      >
        <div data-lightbox-content="" className="uk-image-viewer__header">
          {header ?? (
            <>
              <ImageViewerCounter />
              <ImageViewerClose />
            </>
          )}
        </div>
        <ImageViewerFrame
          image={image}
          index={index}
          reduce={reduce}
          onSwipe={move}
        />
        <div data-lightbox-content="" className="uk-image-viewer__footer">
          {children ?? (
            <>
              <ImageViewerPrevious />
              <ImageViewerCaption />
              <ImageViewerNext />
            </>
          )}
        </div>
      </motion.div>
    </dialog>
  );
}

interface ImageViewerFrameProps {
  image: ImageViewerImage;
  index: number;
  reduce: boolean;
  onSwipe: (direction: -1 | 1) => void;
}

/**
 * 灯箱主体：常驻挂载的形变 frame + 按会话切换的滑动图层。
 *
 * 打开时 frame 从缩略图矩形复制浮出（测量缩略图位置，用 x / y / 缩放
 * 动画放大到全屏），缩略图本身保持原位；关闭时复制图缩回缩略图位置。
 * 滑动图层用会话（id + src）作为 key 进出 AnimatePresence，frame 本体
 * 不随图片切换重挂。
 */
function ImageViewerFrame({
  image,
  index,
  reduce,
  onSwipe,
}: ImageViewerFrameProps): ReactElement {
  const { t } = useImageViewerContext("ImageViewer.Content");
  const [zoom, setZoom] = useState(false);
  const [failed, setFailed] = useState(false);
  const session = `${image.id}-${image.src}`;
  const [selection, setSelection] = useState<{
    session: string;
    index: number;
    direction: -1 | 1;
  }>({ session, index, direction: 1 });
  const changed = selection.session !== session;
  const direction = changed
    ? index < selection.index
      ? -1
      : 1
    : selection.direction;

  if (changed) {
    // 派生状态重置：切换图片时复位缩放、失败标记与滑动方向。
    setSelection({ session, index, direction });
    setZoom(false);
    setFailed(false);
  }

  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const present = useIsPresent();
  const boundsRef = useRef<HTMLDivElement>(null);
  const imageBoxRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // frame 复制图的形变值：打开时从缩略图矩形放大到全屏，关闭时缩回。
  // frame 复制图的形变值：与占位图关联——从缩略图矩形浮出 / 缩回
  // （位置 + 尺寸），缩略图本身保持原位。
  const boxX = useMotionValue(0);
  const boxY = useMotionValue(0);
  const boxWidth = useMotionValue(0);
  const boxHeight = useMotionValue(0);
  const boxOpacity = useMotionValue(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panHelpId = useId();
  const positionSession = useRef(session);

  // 找到当前图片在网格中的缩略图 img（缩略图保持原位，测量其矩形作为
  // 复制图的起始 / 目标位置）。
  const measureThumbnail = useCallback(() => {
    if (reduce) {
      return null;
    }

    const bounds = boundsRef.current;

    if (!bounds) {
      return null;
    }

    const thumbs = document.querySelectorAll<HTMLImageElement>(
      ".uk-image-viewer__thumbnail-img",
    );
    let thumb: HTMLImageElement | null = null;

    for (const candidate of thumbs) {
      if (candidate.getAttribute("src") === image.src) {
        thumb = candidate;
        break;
      }
    }

    if (!thumb) {
      return null;
    }

    // R = 视口（box 放大后的目标矩形）；box 本身在打开 / 关闭动画中尺寸
    // 时刻在变，不能用它的 rect 作为基准。
    const R = bounds.getBoundingClientRect();
    const T = thumb.getBoundingClientRect();

    if (R.width <= 0 || R.height <= 0 || T.width <= 0 || T.height <= 0) {
      return null;
    }

    return {
      x: T.left - R.left,
      y: T.top - R.top,
      width: T.width,
      height: T.height,
      targetWidth: R.width,
      targetHeight: R.height,
    };
  }, [image, reduce]);

  // 打开：从缩略图矩形（位置 + 尺寸）浮出——点开哪张就从哪张的位置
  // 放大到全屏并淡入；缩略图本身不参与动画，始终留在网格里。
  const morphMountedRef = useRef(false);

  useLayoutEffect(() => {
    if (morphMountedRef.current) {
      return;
    }

    morphMountedRef.current = true;

    if (reduce) {
      return;
    }

    const start = () => {
      const target = measureThumbnail();

      // 起点 = 缩略图矩形（位置 + 尺寸）：用 width/height（布局属性）动画
      // 而非 scale，图片 object-contain 会在 box 内持续重排、全程不变形；
      // 测量失败时直接以全屏出现（仅淡入）。
      const from = target
        ? {
            x: target.x,
            y: target.y,
            width: target.width,
            height: target.height,
            targetWidth: target.targetWidth,
            targetHeight: target.targetHeight,
          }
        : null;

      if (from) {
        boxX.set(from.x);
        boxY.set(from.y);
        boxWidth.set(from.width);
        boxHeight.set(from.height);
        animate(boxX, 0, IMAGE_VIEWER_LAYOUT_SPRING);
        animate(boxY, 0, IMAGE_VIEWER_LAYOUT_SPRING);
        animate(boxWidth, from.targetWidth, IMAGE_VIEWER_LAYOUT_SPRING);
        animate(boxHeight, from.targetHeight, IMAGE_VIEWER_LAYOUT_SPRING);
      } else {
        // 找不到缩略图：直接以全屏出现（无弹出动画），仅淡入。
        const bounds = boundsRef.current;

        if (bounds) {
          boxX.set(0);
          boxY.set(0);
          boxWidth.set(bounds.clientWidth);
          boxHeight.set(bounds.clientHeight);
        }
      }

      boxOpacity.set(0);
      animate(boxOpacity, 1, { duration: 0.18, ease: EASE_OUT });
    };

    // 父层（layer）在本帧稍后的 layout effect 中才 showModal；子层的
    // layout effect 先于它运行，此时 dialog 还是 display:none，测量为 0。
    // 微任务在所有 layout effect 之后、绘制之前执行，测量不会闪帧。
    const dialog = imageBoxRef.current?.closest("dialog");

    if (dialog && !dialog.open) {
      queueMicrotask(start);
    } else {
      start();
    }
  }, [boxHeight, boxOpacity, boxWidth, boxX, boxY, measureThumbnail, reduce]);

  // 关闭：presence 翻转时把复制图缩回缩略图矩形（位置 + 尺寸，即打开时
  // 的起点）。用 tween 保证终点精确落在占位图上；面板延迟淡出在同一窗口
  // 内收尾，到位后整体淡出消失。
  const wasPresentRef = useRef(true);

  useLayoutEffect(() => {
    if (!wasPresentRef.current || present) {
      wasPresentRef.current = present;
      return;
    }

    wasPresentRef.current = false;

    if (reduce) {
      return;
    }

    const target = measureThumbnail();

    // 终点 = 缩略图矩形（位置 + 尺寸），回到打开的地方；width/height 动画
    // 让图片保持比例缩回，终点图片正好等于占位图里的样子（tween 精确到达，
    // 弹簧会回弹越界）。测量失败时保持全屏，仅随面板淡出。
    if (target) {
      animate(boxX, target.x, IMAGE_VIEWER_CLOSE_SHRINK);
      animate(boxY, target.y, IMAGE_VIEWER_CLOSE_SHRINK);
      animate(boxWidth, target.width, IMAGE_VIEWER_CLOSE_SHRINK);
      animate(boxHeight, target.height, IMAGE_VIEWER_CLOSE_SHRINK);
    }
  }, [boxHeight, boxWidth, boxX, boxY, measureThumbnail, present, reduce]);

  // 换图时清空平移与滑动起点，避免上一张的位置带到下一张。
  useLayoutEffect(() => {
    if (positionSession.current === session) {
      return;
    }

    positionSession.current = session;
    x.set(0);
    y.set(0);
    swipeStart.current = null;
  }, [session, x, y]);

  // 缩放平移边界 = 图片 2x 尺寸与视口差值的一半；窗口变化时重新测量。
  useLayoutEffect(() => {
    const measure = () => {
      const bounds = boundsRef.current;
      const imageBox = imageBoxRef.current;

      if (!bounds || !imageBox) {
        return;
      }

      const next = {
        x: Math.max(0, (imageBox.clientWidth * 2 - bounds.clientWidth) / 2),
        y: Math.max(0, (imageBox.clientHeight * 2 - bounds.clientHeight) / 2),
      };

      setPan(next);
      x.set(Math.max(-next.x, Math.min(next.x, x.get())));
      y.set(Math.max(-next.y, Math.min(next.y, y.get())));
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(measure);

    if (boundsRef.current) {
      observer.observe(boundsRef.current);
    }

    if (imageBoxRef.current) {
      observer.observe(imageBoxRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [x, y]);

  const onImagePointerDown = useEventCallback(
    (event: React.PointerEvent<HTMLImageElement>) => {
      // 滑动图片时保持键盘焦点在控件上；非缩放态记录滑动起点。
      event.preventDefault();

      if (!zoom && event.isPrimary) {
        swipeStart.current = { x: event.clientX, y: event.clientY };
      }
    },
  );

  const onImagePointerUp = useEventCallback(
    (event: React.PointerEvent<HTMLImageElement>) => {
      const start = swipeStart.current;
      swipeStart.current = null;

      if (!start || zoom) {
        return;
      }

      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;

      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        onSwipe(dx < 0 ? 1 : -1);
      }
    },
  );

  const onImagePointerCancel = useEventCallback(() => {
    swipeStart.current = null;
  });

  return (
    <div className="uk-image-viewer__frame">
      <div ref={boundsRef} className="uk-image-viewer__viewport">
        <motion.div
          ref={imageBoxRef}
          data-lightbox-content=""
          className="uk-image-viewer__image-box"
          style={{
            x: boxX,
            y: boxY,
            width: boxWidth,
            height: boxHeight,
            opacity: boxOpacity,
          }}
        >
          <div
            className={cx(
              "uk-image-viewer__stage",
              !zoom && "uk-image-viewer__stage--fit",
            )}
          >
            <AnimatePresence
              initial={false}
              custom={{ direction, reduce } as ImageSwap}
            >
              <ImageViewerSlide
                key={session}
                image={image}
                direction={direction}
                reduce={reduce}
                zoom={zoom}
                present={present}
                pan={pan}
                x={x}
                y={y}
                onFailed={setFailed}
                onImagePointerDown={onImagePointerDown}
                onImagePointerUp={onImagePointerUp}
                onImagePointerCancel={onImagePointerCancel}
              />
            </AnimatePresence>
          </div>
          {failed ? (
            <output className="uk-image-viewer__error">{t("loadError")}</output>
          ) : null}
        </motion.div>
      </div>
      <button
        type="button"
        aria-label={zoom ? t("zoomOut") : t("zoomIn")}
        aria-pressed={zoom}
        aria-describedby={panHelpId}
        onKeyDown={(event) => {
          if (!zoom) {
            return;
          }

          const dx =
            event.key === "ArrowLeft"
              ? -40
              : event.key === "ArrowRight"
                ? 40
                : 0;
          const dy =
            event.key === "ArrowUp" ? -40 : event.key === "ArrowDown" ? 40 : 0;

          if (!dx && !dy) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          x.set(Math.max(-pan.x, Math.min(pan.x, x.get() + dx)));
          y.set(Math.max(-pan.y, Math.min(pan.y, y.get() + dy)));
        }}
        onClick={() => {
          setZoom((current) => !current);
          // 缩小时把拖拽后的偏移平滑回中，而不是瞬间复位。
          animate(x, 0, IMAGE_VIEWER_LAYOUT_SPRING);
          animate(y, 0, IMAGE_VIEWER_LAYOUT_SPRING);
        }}
        className="uk-image-viewer__zoom"
      >
        {zoom ? (
          <MinimizeIcon size={18} aria-hidden="true" />
        ) : (
          <PlusIcon size={18} aria-hidden="true" />
        )}
      </button>
      <span id={panHelpId} className="uk-image-viewer__visually-hidden">
        {t("panHelp")}
      </span>
    </div>
  );
}

interface ImageViewerSlideProps {
  image: ImageViewerImage;
  direction: -1 | 1;
  reduce: boolean;
  zoom: boolean;
  present: boolean;
  pan: { x: number; y: number };
  x: ReturnType<typeof useMotionValue<number>>;
  y: ReturnType<typeof useMotionValue<number>>;
  onFailed: (failed: boolean) => void;
  onImagePointerDown: (event: React.PointerEvent<HTMLImageElement>) => void;
  onImagePointerUp: (event: React.PointerEvent<HTMLImageElement>) => void;
  onImagePointerCancel: () => void;
}

function ImageViewerSlide({
  image,
  direction,
  reduce,
  zoom,
  present,
  pan,
  x,
  y,
  onFailed,
  onImagePointerDown,
  onImagePointerUp,
  onImagePointerCancel,
}: ImageViewerSlideProps): ReactElement {
  const slidePresent = useIsPresent();

  return (
    <motion.div
      variants={imageSwapVariants}
      initial="enter"
      animate="visible"
      exit="exit"
      custom={{ direction, reduce } as ImageSwap}
      inert={!slidePresent}
      style={slidePresent ? undefined : { pointerEvents: "none" }}
      className="uk-image-viewer__slide"
    >
      <motion.img
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        draggable={false}
        onError={() => {
          if (slidePresent && present) {
            onFailed(true);
          }
        }}
        drag
        dragListener={zoom}
        dragConstraints={{
          left: -pan.x,
          right: pan.x,
          top: -pan.y,
          bottom: pan.y,
        }}
        dragElastic={0.08}
        dragMomentum={false}
        animate={{
          scale: zoom && present ? 2 : 1,
          ...(!present ? { x: 0, y: 0 } : {}),
        }}
        transition={reduce ? { duration: 0 } : IMAGE_VIEWER_LAYOUT_SPRING}
        onPointerDown={onImagePointerDown}
        onPointerUp={onImagePointerUp}
        onPointerCancel={onImagePointerCancel}
        style={{
          x,
          y,
          touchAction: zoom ? "none" : "pan-y",
          cursor: zoom ? "grab" : undefined,
        }}
        className="uk-image-viewer__image"
      />
    </motion.div>
  );
}
