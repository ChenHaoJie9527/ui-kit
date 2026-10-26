import { act, renderHook, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastStack, useToast, type ToastInput } from "../Toast";

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

describe("ToastStack", () => {
  const toasts = [
    { id: "one", title: "One" },
    { id: "two", title: "Two" },
    { id: "three", title: "Three" },
  ];

  it("renders inline, positions the stack, and marks live semantics", () => {
    const { container } = render(
      <ToastStack
        toasts={toasts}
        onDismiss={() => {}}
        position="top-center"
        placement="static"
        portal={false}
      />,
    );
    const stack = container.querySelector("ol");

    expect(stack).toBeTruthy();
    expect(stack?.getAttribute("aria-live")).toBe("polite");
    expect(stack?.getAttribute("aria-atomic")).toBe("false");
    expect(stack?.getAttribute("data-position")).toBe("top-center");
    expect(stack?.getAttribute("data-placement")).toBe("static");
    expect(stack?.querySelectorAll("li")).toHaveLength(3);
  });

  it("limits visible toasts and portals fixed placement to body", () => {
    render(<ToastStack toasts={toasts} maxVisible={2} />);

    const stack = document.body.querySelector("ol");
    expect(stack?.getAttribute("data-placement")).toBe("fixed");
    expect(stack?.querySelectorAll("li")).toHaveLength(2);
    expect(stack?.textContent).toBe("TwoThree");
  });

  it("supports a custom portal root without putting the stack in its React parent", () => {
    const portalRoot = document.createElement("div");
    document.body.append(portalRoot);
    const { container } = render(
      <ToastStack toasts={toasts} portal portalRoot={portalRoot} />,
    );

    expect(container.querySelector("ol")).toBeNull();
    expect(portalRoot.querySelector("ol")).toBeTruthy();
    portalRoot.remove();
  });

  it("keeps absolute placement inside its local positioning context", () => {
    const { container } = render(
      <ToastStack toasts={toasts} placement="absolute" portal={false} />,
    );

    expect(container.querySelector("ol")?.getAttribute("data-placement")).toBe(
      "absolute",
    );
  });
});
