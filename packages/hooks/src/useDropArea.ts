import { useMemo, useRef, useState, type DragEvent } from "react";
import { useEventCallback } from "./useEventCallback";

export interface DropPayload {
  files: File[];
  uris: string[];
  text: string;
}

export interface UseDropAreaOptions {
  /** 拖入文件时触发。 */
  onFiles?: (files: File[]) => void;
  /** 拖入链接时逐条触发。 */
  onUri?: (uri: string) => void;
  /** 拖入纯文本时触发。 */
  onText?: (text: string) => void;
  /** 一次 drop 完成后的完整结果。 */
  onDrop?: (payload: DropPayload) => void;
}

export interface DropAreaBindings<T extends HTMLElement = HTMLElement> {
  onDragEnter: (event: DragEvent<T>) => void;
  onDragOver: (event: DragEvent<T>) => void;
  onDragLeave: (event: DragEvent<T>) => void;
  onDrop: (event: DragEvent<T>) => void;
}

export interface UseDropAreaResult<T extends HTMLElement = HTMLElement> {
  /** 当前是否有内容悬停在放置区域上方。 */
  over: boolean;
  /** 展开到目标元素上的事件处理器。 */
  bind: DropAreaBindings<T>;
}

function parseUris(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function parseDrop(event: DragEvent<HTMLElement>): DropPayload {
  const transfer = event.dataTransfer;
  const files = transfer?.files ? Array.from(transfer.files) : [];
  const uris = parseUris(transfer?.getData("text/uri-list") ?? "");
  const text = transfer?.getData("text/plain") ?? "";

  return { files, uris, text };
}

/**
 * 把任意元素变成拖放区域。
 *
 * 负责维护 dragenter/dragleave 计数（避免子元素导致 over 闪烁），
 * 并把 drop 内容拆成文件、链接和纯文本三类交给调用方。
 */
export function useDropArea<T extends HTMLElement = HTMLElement>(
  options: UseDropAreaOptions = {},
): UseDropAreaResult<T> {
  const [over, setOver] = useState(false);
  const dragDepth = useRef(0);

  const onFiles = useEventCallback((files: File[]) => options.onFiles?.(files));
  const onUri = useEventCallback((uri: string) => options.onUri?.(uri));
  const onText = useEventCallback((text: string) => options.onText?.(text));
  const onDrop = useEventCallback((payload: DropPayload) =>
    options.onDrop?.(payload),
  );

  const bind = useMemo<DropAreaBindings<T>>(() => {
    const onDragEnter = (event: DragEvent<T>) => {
      event.preventDefault();
      dragDepth.current += 1;
      setOver(true);
    };

    const onDragOver = (event: DragEvent<T>) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    };

    const onDragLeave = (event: DragEvent<T>) => {
      event.preventDefault();
      dragDepth.current = Math.max(0, dragDepth.current - 1);

      if (dragDepth.current === 0) {
        setOver(false);
      }
    };

    const handleDrop = (event: DragEvent<T>) => {
      event.preventDefault();
      dragDepth.current = 0;
      setOver(false);

      const payload = parseDrop(event as DragEvent<HTMLElement>);

      if (payload.files.length > 0) {
        onFiles(payload.files);
      }
      payload.uris.forEach(onUri);
      if (payload.text) {
        onText(payload.text);
      }
      onDrop(payload);
    };

    return {
      onDragEnter,
      onDragOver,
      onDragLeave,
      onDrop: handleDrop,
    };
  }, [onDrop, onFiles, onText, onUri]);

  return { over, bind };
}
