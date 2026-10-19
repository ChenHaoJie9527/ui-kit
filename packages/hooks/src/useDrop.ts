import { useCallback, useState } from "react";
import {
  useDropArea,
  type DropAreaBindings,
  type DropPayload,
} from "./useDropArea";

export interface UseDropResult<T extends HTMLElement = HTMLElement> {
  over: boolean;
  files: File[];
  uris: string[];
  text: string;
  bind: DropAreaBindings<T>;
}

const emptyPayload: DropPayload = { files: [], uris: [], text: "" };

/**
 * `useDropArea` 的便捷版本：直接保存最近一次 drop 的内容。
 *
 * 需要更细的控制（比如只处理文件）时用 useDropArea。
 */
export function useDrop<
  T extends HTMLElement = HTMLElement,
>(): UseDropResult<T> {
  const [payload, setPayload] = useState<DropPayload>(emptyPayload);
  const { over, bind } = useDropArea<T>({ onDrop: setPayload });

  const reset = useCallback(() => setPayload(emptyPayload), []);

  return {
    over,
    files: payload.files,
    uris: payload.uris,
    text: payload.text,
    bind: {
      ...bind,
      onDragLeave: (event) => {
        bind.onDragLeave(event);
        reset();
      },
    },
  };
}
