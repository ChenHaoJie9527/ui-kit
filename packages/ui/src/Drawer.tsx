import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type RefAttributes,
  type RefObject,
} from "react";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { createPortal } from "react-dom";
import {
  useControllableState,
  useEventCallback,
  useFocusTrap,
  useLockBodyScroll,
} from "seam-hooks";
import { Button } from "./Button";
import {
  DRAWER_ENTER_TRANSITION,
  DRAWER_EXIT_TRANSITION,
  REDUCED_MOTION_TRANSITION,
} from "./motion";
import { cx } from "./utils/cx";

export type DrawerSide = "left" | "right";
export type DrawerSize = "sm" | "md" | "lg";

export interface DrawerRootProps {
  children: ReactNode;
  /** 受控打开状态。 */
  open?: boolean;
  /** 非受控模式下的初始状态。 */
  defaultOpen?: boolean;
  /** 打开状态变化时触发。 */
  onOpenChange?: (open: boolean) => void;
}

interface DrawerContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerId: string;
  contentId: string;
  titleId: string;
  descriptionId: string;
  hasTitle: boolean;
  setHasTitle: (hasTitle: boolean) => void;
  hasDescription: boolean;
  setHasDescription: (hasDescription: boolean) => void;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useDrawerContext(component: string): DrawerContextValue {
  const context = useContext(DrawerContext);

  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Drawer.Root>`);
  }

  return context;
}

function composeHandler<T extends { defaultPrevented: boolean }>(
  childHandler: ((event: T) => void) | undefined,
  handler: (event: T) => void,
) {
  return (event: T) => {
    childHandler?.(event);

    if (!event.defaultPrevented) {
      handler(event);
    }
  };
}

/** Drawer 状态与语义 ID 的根节点。 */
function DrawerRoot({
  children,
  open,
  defaultOpen,
  onOpenChange,
}: DrawerRootProps): ReactElement {
  const baseId = useId();
  const [hasTitle, setHasTitle] = useState(false);
  const [hasDescription, setHasDescription] = useState(false);
  const [current, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });
  const value = useMemo<DrawerContextValue>(
    () => ({
      open: current,
      setOpen,
      triggerId: `${baseId}-trigger`,
      contentId: `${baseId}-content`,
      titleId: `${baseId}-title`,
      descriptionId: `${baseId}-description`,
      hasTitle,
      setHasTitle,
      hasDescription,
      setHasDescription,
    }),
    [baseId, current, hasDescription, hasTitle, setOpen],
  );

  return (
    <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>
  );
}

export interface DrawerTriggerProps {
  children: ReactElement;
}

/** 包装一个交互元素，同步 Drawer 的状态与 ARIA 关联。 */
function DrawerTrigger({ children }: DrawerTriggerProps): ReactElement {
  const context = useDrawerContext("Drawer.Trigger");
  const child = children as ReactElement<Record<string, unknown>>;
  const childOnClick = child.props.onClick as
    | ((event: MouseEvent<HTMLElement>) => void)
    | undefined;

  return cloneElement(child, {
    id: context.triggerId,
    "aria-haspopup": "dialog",
    "aria-expanded": context.open,
    "aria-controls": context.open ? context.contentId : undefined,
    onClick: composeHandler(childOnClick, () => {
      context.setOpen(!context.open);
    }),
  });
}

export interface DrawerCloseProps {
  children?: ReactElement;
  label?: string;
}

/** 包装关闭触发器，或渲染一个默认关闭按钮。 */
function DrawerClose({
  children,
  label = "Close",
}: DrawerCloseProps): ReactElement {
  const context = useDrawerContext("Drawer.Close");

  if (isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown>>;
    const childOnClick = child.props.onClick as
      | ((event: MouseEvent<HTMLElement>) => void)
      | undefined;

    return cloneElement(child, {
      onClick: composeHandler(childOnClick, () => {
        context.setOpen(false);
      }),
    });
  }

  return (
    <Button variant="ghost" onClick={() => context.setOpen(false)}>
      {label}
    </Button>
  );
}

export type DrawerHeaderProps = HTMLAttributes<HTMLElement>;

const DrawerHeader: ForwardRefExoticComponent<
  DrawerHeaderProps & RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, DrawerHeaderProps>(function DrawerHeader(
  { className, ...rest },
  ref,
) {
  return (
    <header
      {...rest}
      ref={ref}
      className={cx("uk-drawer__header", className)}
    />
  );
});

export type DrawerTitleProps = HTMLAttributes<HTMLHeadingElement>;

const DrawerTitle: ForwardRefExoticComponent<
  DrawerTitleProps & RefAttributes<HTMLHeadingElement>
> = forwardRef<HTMLHeadingElement, DrawerTitleProps>(function DrawerTitle(
  { className, children, ...rest },
  ref,
) {
  const context = useDrawerContext("Drawer.Title");
  const setHasTitle = context.setHasTitle;

  useEffect(() => {
    setHasTitle(true);
    return () => setHasTitle(false);
  }, [setHasTitle]);

  return (
    <h2
      {...rest}
      ref={ref}
      id={context.titleId}
      className={cx("uk-drawer__title", className)}
    >
      {children}
    </h2>
  );
});

export type DrawerDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

const DrawerDescription: ForwardRefExoticComponent<
  DrawerDescriptionProps & RefAttributes<HTMLParagraphElement>
> = forwardRef<HTMLParagraphElement, DrawerDescriptionProps>(
  function DrawerDescription({ className, ...rest }, ref) {
    const context = useDrawerContext("Drawer.Description");
    const setHasDescription = context.setHasDescription;

    useEffect(() => {
      setHasDescription(true);
      return () => setHasDescription(false);
    }, [setHasDescription]);

    return (
      <p
        {...rest}
        ref={ref}
        id={context.descriptionId}
        className={cx("uk-drawer__description", className)}
      />
    );
  },
);

export type DrawerBodyProps = HTMLAttributes<HTMLDivElement>;

const DrawerBody: ForwardRefExoticComponent<
  DrawerBodyProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, DrawerBodyProps>(function DrawerBody(
  { className, ...rest },
  ref,
) {
  return (
    <div {...rest} ref={ref} className={cx("uk-drawer__body", className)} />
  );
});

export type DrawerFooterProps = HTMLAttributes<HTMLElement>;

const DrawerFooter: ForwardRefExoticComponent<
  DrawerFooterProps & RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, DrawerFooterProps>(function DrawerFooter(
  { className, ...rest },
  ref,
) {
  return (
    <footer
      {...rest}
      ref={ref}
      className={cx("uk-drawer__footer", className)}
    />
  );
});

export interface DrawerContentProps {
  children?: ReactNode;
  className?: string;
  /** 从哪一侧滑入，默认 right。 */
  side?: DrawerSide;
  /** 面板宽度，默认 md。 */
  size?: DrawerSize;
  /** 点击遮罩是否关闭，默认 true。 */
  closeOnBackdropClick?: boolean;
  /** 按 Esc 是否关闭，默认 true。 */
  closeOnEscape?: boolean;
  /** 打开后优先聚焦的元素；不传则聚焦第一个可聚焦元素。 */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** 关闭后恢复焦点的元素；默认恢复到打开前的活动元素。 */
  returnFocusRef?: RefObject<HTMLElement | null>;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

interface DrawerLayerProps extends DrawerContentProps {
  requestClose: () => void;
  contentId: string;
  titleId: string;
  descriptionId: string;
  hasTitle: boolean;
  hasDescription: boolean;
}

function DrawerLayer({
  requestClose,
  contentId,
  titleId,
  descriptionId,
  hasTitle,
  hasDescription,
  children,
  side = "right",
  size = "md",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  initialFocusRef,
  returnFocusRef,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: DrawerLayerProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const isPresent = useIsPresent();
  const reduceMotion = useReducedMotion() ?? false;

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

  useFocusTrap({
    active: true,
    containerRef: dialogRef,
    initialFocusRef,
    returnFocusRef: returnFocusRef ?? openerRef,
  });

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const reopen = () => {
      if (dialog.open) {
        return;
      }

      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    };
    const onClose = () => {
      if (!closeOnEscape) {
        reopen();
        return;
      }

      requestClose();
    };
    const onCancel = (event: Event) => {
      event.preventDefault();

      if (closeOnEscape) {
        requestClose();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape || event.key !== "Escape" || event.defaultPrevented) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };
    const onClick = (event: globalThis.MouseEvent) => {
      if (closeOnBackdropClick && event.target === dialog) {
        requestClose();
      }
    };

    dialog.addEventListener("close", onClose);
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("keydown", onKeyDown, true);
    dialog.addEventListener("click", onClick);

    return () => {
      dialog.removeEventListener("close", onClose);
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("keydown", onKeyDown, true);
      dialog.removeEventListener("click", onClick);
    };
  }, [closeOnBackdropClick, closeOnEscape, requestClose]);

  const offscreen = side === "right" ? "100%" : "-100%";
  // Native light dismiss follows the same split as our own handlers: Escape only
  // when backdrop closing is off, and no native dismissal at all when Escape is
  // disabled (backdrop clicks still run through the dialog click handler).
  const closedBy = !closeOnEscape
    ? "none"
    : closeOnBackdropClick
      ? "any"
      : "closerequest";

  return (
    <dialog
      ref={dialogRef}
      id={contentId}
      className="uk-drawer"
      closedby={closedBy}
      data-state={isPresent ? "open" : "closed"}
      inert={!isPresent}
      aria-label={ariaLabel}
      aria-labelledby={
        ariaLabelledBy ??
        (ariaLabel ? undefined : hasTitle ? titleId : undefined)
      }
      aria-describedby={
        ariaDescribedBy ?? (hasDescription ? descriptionId : undefined)
      }
    >
      <motion.div
        className={cx("uk-drawer__panel", className)}
        data-side={side}
        data-size={size}
        // Same-edge slide: right starts fully off-screen right (x: 100%) and
        // travels left; left starts at x: -100% and travels right. No opacity
        // fade — fading would read as appearing in place, not travelling.
        initial={reduceMotion ? { opacity: 0 } : { x: offscreen }}
        animate={
          reduceMotion
            ? { opacity: 1, transition: REDUCED_MOTION_TRANSITION }
            : { x: 0, transition: DRAWER_ENTER_TRANSITION }
        }
        exit={
          reduceMotion
            ? { opacity: 0, transition: REDUCED_MOTION_TRANSITION }
            : { x: offscreen, transition: DRAWER_EXIT_TRANSITION }
        }
      >
        {children}
      </motion.div>
    </dialog>
  );
}

/** Portal、原生 dialog、焦点与 presence 生命周期的语义层。 */
function DrawerContent({
  children,
  side = "right",
  size = "md",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  initialFocusRef,
  returnFocusRef,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: DrawerContentProps): ReactElement | null {
  const context = useDrawerContext("Drawer.Content");
  const requestClose = useEventCallback(() => {
    context.setOpen(false);
  });
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
        {context.open ? (
          <DrawerLayer
            key="uk-drawer"
            requestClose={requestClose}
            contentId={context.contentId}
            titleId={context.titleId}
            descriptionId={context.descriptionId}
            hasTitle={context.hasTitle}
            hasDescription={context.hasDescription}
            side={side}
            size={size}
            closeOnBackdropClick={closeOnBackdropClick}
            closeOnEscape={closeOnEscape}
            initialFocusRef={initialFocusRef}
            returnFocusRef={returnFocusRef}
            className={className}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
          >
            {children}
          </DrawerLayer>
        ) : null}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}

export interface DrawerComponent {
  Root: typeof DrawerRoot;
  Trigger: typeof DrawerTrigger;
  Content: typeof DrawerContent;
  Header: typeof DrawerHeader;
  Title: typeof DrawerTitle;
  Description: typeof DrawerDescription;
  Body: typeof DrawerBody;
  Footer: typeof DrawerFooter;
  Close: typeof DrawerClose;
}

/**
 * 边缘抽屉。
 *
 * 原生 dialog 承载模态语义，面板从 side 指定的一侧滑入；焦点进入、Tab 循环、
 * 关闭后恢复焦点与滚动锁定由 hooks 补齐。仅提供组合式 API。
 */
export const Drawer: DrawerComponent = {
  Root: DrawerRoot,
  Trigger: DrawerTrigger,
  Content: DrawerContent,
  Header: DrawerHeader,
  Title: DrawerTitle,
  Description: DrawerDescription,
  Body: DrawerBody,
  Footer: DrawerFooter,
  Close: DrawerClose,
};
