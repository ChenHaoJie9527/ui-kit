import { useCallback, useState } from "react";

export interface CopyToClipboardState {
  /** 最近一次成功复制的文本。 */
  value: string | undefined;
  /** 最近一次失败的原因。 */
  error: Error | undefined;
  /** 最近一次操作是否成功。 */
  copied: boolean;
}

export type CopyToClipboard = (text: string) => Promise<boolean>;

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function fallbackCopy(text: string): void {
  if (typeof document === "undefined") {
    throw new Error("Clipboard is not available in this environment");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);

  try {
    textarea.select();
    const copied = document.execCommand("copy");

    if (!copied) {
      throw new Error("Copy command was rejected");
    }
  } finally {
    textarea.remove();
  }
}

/**
 * 复制文本到剪贴板。
 *
 * 优先使用异步 Clipboard API；不可用（非安全上下文、旧浏览器）时
 * 退回到 textarea + execCommand。返回 [state, copy]，copy 成功为 true。
 */
export function useCopyToClipboard(): [CopyToClipboardState, CopyToClipboard] {
  const [state, setState] = useState<CopyToClipboardState>({
    value: undefined,
    error: undefined,
    copied: false,
  });

  const copy = useCallback(async (text: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }

      setState({ value: text, error: undefined, copied: true });
      return true;
    } catch (error) {
      setState({ value: undefined, error: toError(error), copied: false });
      return false;
    }
  }, []);

  return [state, copy];
}
