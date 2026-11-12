import type { Toast, ToastInput } from "./toast-types";

let idSeed = 0;

export function createToast(input: ToastInput, defaultDuration: number): Toast {
  return {
    duration: defaultDuration,
    dismissible: true,
    ...input,
    id: input.id ?? `toast-${idSeed++}`,
    createdAt: Date.now(),
  };
}
