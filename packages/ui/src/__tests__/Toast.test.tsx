import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToast, type ToastInput } from "../Toast";

function renderToastHook(options?: Parameters<typeof useToast>[0]) {
  return renderHook(() => useToast(options));
}

describe("useToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds, updates, dismisses, and clears toasts", () => {
    const { result } = renderToastHook();

    act(() => {
      result.current.showToast({ id: "saved", title: "已保存" });
    });
    expect(result.current.toasts.map((toast) => toast.id)).toEqual(["saved"]);

    act(() => {
      result.current.updateToast("saved", {
        title: "保存完成",
        status: "success",
      });
    });
    expect(result.current.toasts[0]).toMatchObject({
      id: "saved",
      title: "保存完成",
      status: "success",
    });

    act(() => {
      result.current.dismissToast("saved");
    });
    expect(result.current.toasts).toEqual([]);

    act(() => {
      result.current.showToast({ title: "第一条" });
      result.current.showToast({ title: "第二条" });
    });
    act(() => {
      result.current.clearToasts();
    });
    expect(result.current.toasts).toEqual([]);
  });

  it("reuses the same id and keeps only the newest toasts within a limit", () => {
    const { result } = renderToastHook({ limit: 2 });

    act(() => {
      result.current.showToast({ id: "one", title: "One" });
      result.current.showToast({ id: "one", title: "One updated" });
      result.current.showToast({ title: "Two" });
    });
    expect(result.current.toasts.map((toast) => toast.title)).toEqual([
      "One updated",
      "Two",
    ]);

    act(() => {
      result.current.showToast({ title: "Three" });
    });
    expect(result.current.toasts.map((toast) => toast.title)).toEqual([
      "Two",
      "Three",
    ]);
  });

  it("dismisses automatically and resets the timer when duration changes", () => {
    const { result } = renderToastHook({ defaultDuration: 1000 });

    act(() => {
      result.current.showToast({ id: "timer", title: "Timer" });
    });

    act(() => {
      vi.advanceTimersByTime(700);
    });
    act(() => {
      result.current.updateToast("timer", { duration: 2000 });
    });
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(result.current.toasts).toEqual([]);
  });

  it("keeps persistent toasts when duration is zero or negative", () => {
    const initialToasts: ToastInput[] = [{ id: "sticky", title: "Sticky" }];
    const { result } = renderToastHook({
      initialToasts,
      defaultDuration: 0,
    });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(result.current.toasts).toHaveLength(1);
  });
});
