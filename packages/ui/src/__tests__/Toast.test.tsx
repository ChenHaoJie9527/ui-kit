import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast, type ToastOptions } from "../Toast";

function Harness({ options }: { options: ToastOptions }) {
  const { toast } = useToast();

  return (
    <button type="button" onClick={() => toast(options)}>
      显示提示
    </button>
  );
}

function getToast(): HTMLElement {
  const toast = document.querySelector(".uk-toast");

  if (!(toast instanceof HTMLElement)) {
    throw new Error("toast not rendered");
  }

  return toast;
}

function MultiHarness() {
  const { toast } = useToast();

  return (
    <button
      type="button"
      onClick={() => {
        toast({ title: "第一条", duration: 0 });
        toast({ title: "第二条", duration: 0 });
      }}
    >
      连续弹出
    </button>
  );
}

function BadConsumer() {
  useToast();
  return null;
}

async function flushMotion() {
  await act(async () => {
    vi.advanceTimersByTime(600);
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Toast", () => {
  it("renders title, description and variant", () => {
    render(
      <ToastProvider>
        <Harness
          options={{
            title: "已保存",
            description: "改动已同步到本地。",
            variant: "success",
          }}
        />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "显示提示" }));

    expect(screen.getByText("已保存")).toBeTruthy();
    expect(screen.getByText("改动已同步到本地。")).toBeTruthy();
    expect(getToast().dataset.variant).toBe("success");
  });

  it("auto dismisses after the duration and exit animation", async () => {
    render(
      <ToastProvider duration={3000}>
        <Harness options={{ title: "临时提示" }} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "显示提示" }));

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(screen.getByText("临时提示")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(getToast().dataset.state).toBe("closed");

    act(() => {
      vi.advanceTimersByTime(200);
    });
    await flushMotion();
    expect(screen.queryByText("临时提示")).toBeNull();
  });

  it("keeps persistent toasts on screen", () => {
    render(
      <ToastProvider>
        <Harness options={{ title: "常驻提示", duration: 0 }} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "显示提示" }));

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText("常驻提示")).toBeTruthy();
  });

  it("dismisses from the close button", async () => {
    render(
      <ToastProvider>
        <Harness options={{ title: "可关闭" }} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "显示提示" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(getToast().dataset.state).toBe("closed");

    act(() => {
      vi.advanceTimersByTime(200);
    });
    await flushMotion();
    expect(screen.queryByText("可关闭")).toBeNull();
  });

  it("pauses auto dismiss while hovered", async () => {
    render(
      <ToastProvider duration={3000}>
        <Harness options={{ title: "悬停暂停" }} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "显示提示" }));
    const toast = getToast();

    fireEvent.mouseEnter(toast);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText("悬停暂停")).toBeTruthy();

    fireEvent.mouseLeave(toast);

    act(() => {
      vi.advanceTimersByTime(3000);
      vi.advanceTimersByTime(200);
    });
    await flushMotion();
    expect(screen.queryByText("悬停暂停")).toBeNull();
  });

  it("keeps only the newest toasts up to maxToasts", () => {
    render(
      <ToastProvider maxToasts={1}>
        <MultiHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "连续弹出" }));

    expect(screen.queryByText("第一条")).toBeNull();
    expect(screen.getByText("第二条")).toBeTruthy();
  });

  it("requires a provider", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      expect(() => render(<BadConsumer />)).toThrow(
        "useToast must be used within <ToastProvider>",
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
