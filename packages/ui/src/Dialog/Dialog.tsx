import type { ReactElement, ReactNode, RefObject } from "react";

import { Button } from "../Button";
import { DialogBody } from "./DialogBody";
import { DialogClose } from "./DialogClose";
import { DialogContent } from "./DialogContent";
import { DialogDescription } from "./DialogDescription";
import { DialogFooter } from "./DialogFooter";
import { DialogHeader } from "./DialogHeader";
import { DialogRoot } from "./DialogRoot";
import { DialogTitle } from "./DialogTitle";
import { DialogTrigger } from "./DialogTrigger";

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

export function LegacyDialog({
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
