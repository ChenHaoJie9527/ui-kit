import type { ReactNode } from "react";
import type { HTMLMotionProps } from "motion/react";

export type ToastStatus = "neutral" | "info" | "loading" | "success" | "error";

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type ToastAction = {
  label: ReactNode;
  onClick: (toast: Toast) => void;
};

export type Toast = {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  status?: ToastStatus;
  action?: ToastAction;
  duration?: number;
  dismissible?: boolean;
  createdAt?: number;
};

export type ToastInput = Omit<Toast, "id" | "createdAt"> & {
  id?: string;
};

export type ToastUpdateInput = Omit<Partial<ToastInput>, "id">;

export type UseToastOptions = {
  initialToasts?: ToastInput[];
  defaultDuration?: number;
  limit?: number;
};

export type ToastPlacement = "static" | "absolute" | "fixed";

export type ToastClassNames = {
  root?: string;
  item?: string;
  surface?: string;
  iconWrap?: string;
  content?: string;
  title?: string;
  description?: string;
  action?: string;
  close?: string;
};

export type ToastIcons = Partial<Record<ToastStatus, ReactNode>>;

export type ToastStackProps = Omit<HTMLMotionProps<"ol">, "children"> & {
  toasts: Toast[];
  onDismiss?: (id: string) => void;
  onPauseToast?: (id: string) => void;
  onResumeToast?: (id: string) => void;
  position?: ToastPosition;
  placement?: ToastPlacement;
  portal?: boolean;
  portalRoot?: Element | null;
  maxVisible?: number;
  className?: string;
  classNames?: ToastClassNames;
  icons?: ToastIcons;
  renderToast?: (toast: Toast) => ReactNode;
};
