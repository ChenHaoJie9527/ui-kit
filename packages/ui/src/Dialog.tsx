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
import { OVERLAY_SPRING, REDUCED_MOTION_TRANSITION } from "./motion";
import { cx } from "./utils/cx";

export interface DialogProps {
  /** 是否打开。由调用方控制，配合 onOpenChange 使用。 */
  open: boolean;
  /** 打开状态变化时触发，用于同步外部 state。 */
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  /** 关闭按钮的无障碍名称，默认 Close。 */
  closeLabel?: string;
  showCloseButton?: boolean;
  /** 点击遮罩是否关闭，默认 true。 */
  closeOnBackdropClick?: boolean;
  /** 按 Esc 是否关闭，默认 true。 */
  closeOnEscape?: boolean;
  /** 打开后优先聚焦的元素；不传则聚焦第一个可聚焦元素。 */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** 关闭后恢复焦点的元素；默认恢复到打开前的活动元素。 */
  returnFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  "aria-label"?: string;
}

export interface DialogRootProps {
  children: ReactNode;
  /** 受控打开状态。 */
  open?: boolean;
  /** 非受控模式下的初始状态。 */
  defaultOpen?: boolean;
  /** 打开状态变化时触发。 */
  onOpenChange?: (open: boolean) => void;
}

interface DialogContextValue {
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

const DialogContext = createContext<DialogContextValue | null>(null);

const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useDialogContext(component: string): DialogContextValue {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Dialog.Root>`);
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

/** Dialog 状态与语义 ID 的根节点。 */
function DialogRoot({
  children,
  open,
  defaultOpen,
  onOpenChange,
}: DialogRootProps): ReactElement {
  const baseId = useId();
  const [hasTitle, setHasTitle] = useState(false);
  const [hasDescription, setHasDescription] = useState(false);
  const [current, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });
  const value = useMemo<DialogContextValue>(
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
    <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
  );
}

export interface DialogTriggerProps {
  children: ReactElement;
}

/** 包装一个交互元素，同步 dialog 的状态与 ARIA 关联。 */
function DialogTrigger({ children }: DialogTriggerProps): ReactElement {
  const context = useDialogContext("Dialog.Trigger");
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

export interface DialogCloseProps {
  children?: ReactElement;
  label?: string;
}

/** 包装关闭触发器，或渲染一个默认关闭按钮。 */
function DialogClose({
  children,
  label = "Close",
}: DialogCloseProps): ReactElement {
  const context = useDialogContext("Dialog.Close");

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

export type DialogHeaderProps = HTMLAttributes<HTMLElement>;

const DialogHeader: ForwardRefExoticComponent<
  DialogHeaderProps & RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, DialogHeaderProps>(function DialogHeader(
  { className, ...rest },
  ref,
) {
  return (
    <header
      {...rest}
      ref={ref}
      className={cx("uk-dialog__header", className)}
    />
  );
});

export type DialogTitleProps = HTMLAttributes<HTMLHeadingElement>;

const DialogTitle: ForwardRefExoticComponent<
  DialogTitleProps & RefAttributes<HTMLHeadingElement>
> = forwardRef<HTMLHeadingElement, DialogTitleProps>(function DialogTitle(
  { className, children, ...rest },
  ref,
) {
  const context = useDialogContext("Dialog.Title");
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
      className={cx("uk-dialog__title", className)}
    >
      {children}
    </h2>
  );
});

export type DialogDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

const DialogDescription: ForwardRefExoticComponent<
  DialogDescriptionProps & RefAttributes<HTMLParagraphElement>
> = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  function DialogDescription({ className, ...rest }, ref) {
    const context = useDialogContext("Dialog.Description");
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
        className={cx("uk-dialog__description", className)}
      />
    );
  },
);

export type DialogBodyProps = HTMLAttributes<HTMLDivElement>;

const DialogBody: ForwardRefExoticComponent<
  DialogBodyProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, DialogBodyProps>(function DialogBody(
  { className, ...rest },
  ref,
) {
  return (
    <div {...rest} ref={ref} className={cx("uk-dialog__body", className)} />
  );
});

export type DialogFooterProps = HTMLAttributes<HTMLElement>;

const DialogFooter: ForwardRefExoticComponent<
  DialogFooterProps & RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, DialogFooterProps>(function DialogFooter(
  { className, ...rest },
  ref,
) {
  return (
    <footer
      {...rest}
      ref={ref}
      className={cx("uk-dialog__footer", className)}
    />
  );
});

export interface DialogContentProps {
  children?: ReactNode;
  className?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

interface DialogLayerProps extends DialogContentProps {
  requestClose: () => void;
  contentId: string;
  titleId: string;
  descriptionId: string;
  hasTitle: boolean;
  hasDescription: boolean;
}

function DialogLayer({
  requestClose,
  contentId,
  titleId,
  descriptionId,
  hasTitle,
  hasDescription,
  children,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  initialFocusRef,
  returnFocusRef,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: DialogLayerProps): ReactElement {
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

  return (
    <dialog
      ref={dialogRef}
      id={contentId}
      className={cx("uk-dialog", className)}
      closedby={closeOnEscape || closeOnBackdropClick ? "any" : "none"}
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
        className="uk-dialog__panel"
        initial={
          reduceMotion
            ? { opacity: 0 }
            : {
                opacity: 0,
                transform: "translateY(12px) scale(0.96)",
              }
        }
        animate={{
          opacity: 1,
          transform: "translateY(0px) scale(1)",
          transition: reduceMotion
            ? REDUCED_MOTION_TRANSITION
            : { ...OVERLAY_SPRING, delay: 0.06 },
        }}
        exit={
          reduceMotion
            ? { opacity: 0, transition: REDUCED_MOTION_TRANSITION }
            : {
                opacity: 0,
                transform: "translateY(8px) scale(0.97)",
                transition: OVERLAY_SPRING,
              }
        }
      >
        {children}
      </motion.div>
    </dialog>
  );
}

/** Portal、原生 dialog、焦点与 presence 生命周期的语义层。 */
function DialogContent({
  children,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  initialFocusRef,
  returnFocusRef,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: DialogContentProps): ReactElement | null {
  const context = useDialogContext("Dialog.Content");
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
          <DialogLayer
            key="uk-dialog"
            requestClose={requestClose}
            contentId={context.contentId}
            titleId={context.titleId}
            descriptionId={context.descriptionId}
            hasTitle={context.hasTitle}
            hasDescription={context.hasDescription}
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
          </DialogLayer>
        ) : null}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}

/** 保持既有 slot API 兼容的便捷封装。 */
function LegacyDialog({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  closeLabel = "Close",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  initialFocusRef,
  returnFocusRef,
  className,
  "aria-label": ariaLabel,
}: DialogProps): ReactElement {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={className}
        closeOnBackdropClick={closeOnBackdropClick}
        closeOnEscape={closeOnEscape}
        initialFocusRef={initialFocusRef}
        returnFocusRef={returnFocusRef}
        aria-label={ariaLabel}
      >
        {title || description || showCloseButton ? (
          <DialogHeader>
            <div className="uk-dialog__heading">
              {title ? <DialogTitle>{title}</DialogTitle> : null}
              {description ? (
                <DialogDescription>{description}</DialogDescription>
              ) : null}
            </div>
            {showCloseButton ? (
              <DialogClose>
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label={closeLabel}
                  className="uk-dialog__close"
                >
                  <svg
                    viewBox="0 0 20 20"
                    width="16"
                    height="16"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 5l10 10M15 5L5 15"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </Button>
              </DialogClose>
            ) : null}
          </DialogHeader>
        ) : null}

        <DialogBody>{children}</DialogBody>

        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </DialogRoot>
  );
}

export interface DialogComponent {
  (props: DialogProps): ReactElement;
  Root: typeof DialogRoot;
  Trigger: typeof DialogTrigger;
  Content: typeof DialogContent;
  Header: typeof DialogHeader;
  Title: typeof DialogTitle;
  Description: typeof DialogDescription;
  Body: typeof DialogBody;
  Footer: typeof DialogFooter;
  Close: typeof DialogClose;
}

/**
 * 模态对话框。
 *
 * 组合式 API 由 Root / Trigger / Content 和各语义层组成；无子组件的调用
 * 保留既有 title / description / footer slot API。
 */
export const Dialog: DialogComponent = Object.assign(LegacyDialog, {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Content: DialogContent,
  Header: DialogHeader,
  Title: DialogTitle,
  Description: DialogDescription,
  Body: DialogBody,
  Footer: DialogFooter,
  Close: DialogClose,
});
