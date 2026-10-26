import {
  act,
  fireEvent,
  renderHook,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastStack, useToast, type Toast, type ToastInput } from "../Toast";

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
    let savedId = "";

    act(() => {
      savedId = result.current.showToast({ title: "已保存" });
    });
    expect(result.current.toasts.map((toast) => toast.id)).toEqual([savedId]);

    act(() => {
      result.current.updateToast(savedId, {
        title: "保存完成",
        status: "success",
      });
    });
    expect(result.current.toasts[0]).toMatchObject({
      id: savedId,
      title: "保存完成",
      status: "success",
    });

    act(() => {
      result.current.dismissToast(savedId);
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

  it("appends repeated toasts and keeps only the newest within a limit", () => {
    const { result } = renderToastHook({ limit: 2 });

    act(() => {
      result.current.showToast({ title: "One" });
      result.current.showToast({ title: "One" });
      result.current.showToast({ title: "Two" });
    });
    expect(result.current.toasts.map((toast) => toast.title)).toEqual([
      "One",
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
    let timerId = "";

    act(() => {
      timerId = result.current.showToast({ title: "Timer" });
    });

    act(() => {
      vi.advanceTimersByTime(700);
    });
    act(() => {
      result.current.updateToast(timerId, { duration: 2000 });
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

  it("pauses auto-dismiss while hovering and resumes on leave", () => {
    const { result } = renderToastHook({ defaultDuration: 1000 });
    let hoverId = "";

    act(() => {
      hoverId = result.current.showToast({ title: "Hover" });
    });
    act(() => {
      vi.advanceTimersByTime(700);
    });
    act(() => {
      result.current.pauseToast(hoverId);
    });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.resumeToast(hoverId);
    });
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.toasts).toEqual([]);
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

  it("renders status content with a custom icon, action, and accessible dismissal", () => {
    const onAction = vi.fn<(toast: Toast) => void>();
    const onDismiss = vi.fn<(id: string) => void>();

    render(
      <ToastStack
        toasts={[
          {
            id: "saved",
            title: "已保存",
            description: "文档已同步",
            status: "success",
            action: { label: "查看", onClick: onAction },
          },
        ]}
        icons={{ success: <span>OK</span> }}
        onDismiss={onDismiss}
        placement="static"
        portal={false}
      />,
    );

    expect(screen.getByText("OK")).toBeTruthy();
    expect(screen.getByText("已保存")).toBeTruthy();
    expect(screen.getByText("文档已同步")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "查看" }));
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "saved", title: "已保存" }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    expect(onDismiss).toHaveBeenCalledWith("saved");
  });

  it("hides dismissal when a toast is not dismissible", () => {
    render(
      <ToastStack
        toasts={[{ id: "sticky", title: "Sticky", dismissible: false }]}
        onDismiss={() => {}}
        placement="static"
        portal={false}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Dismiss notification" }),
    ).toBeNull();
  });

  it("supports fully custom item rendering while keeping keyboard dismissal", () => {
    render(
      <ToastStack
        toasts={[{ id: "custom", title: "Ignored" }]}
        renderToast={(toast) => `Custom ${toast.id}`}
        onDismiss={() => {}}
        placement="static"
        portal={false}
      />,
    );

    expect(screen.getByText("Custom custom")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Dismiss notification" }),
    ).toBeTruthy();
  });

  it("pauses and resumes a toast on pointer movement", () => {
    const onPauseToast = vi.fn<(id: string) => void>();
    const onResumeToast = vi.fn<(id: string) => void>();

    render(
      <ToastStack
        toasts={[{ id: "hover", title: "Hover" }]}
        onDismiss={() => {}}
        onPauseToast={onPauseToast}
        onResumeToast={onResumeToast}
        placement="static"
        portal={false}
      />,
    );

    fireEvent.pointerEnter(screen.getByText("Hover").closest("li")!);
    fireEvent.pointerLeave(screen.getByText("Hover").closest("li")!);

    expect(onPauseToast).toHaveBeenCalledWith("hover");
    expect(onResumeToast).toHaveBeenCalledWith("hover");
  });
});
