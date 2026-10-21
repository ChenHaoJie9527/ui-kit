import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../Button";
import { Dialog } from "../Dialog";
import { Tooltip } from "../Tooltip";

function TooltipExample({
  delayDuration = 0,
  closeDelay = 0,
  defaultOpen,
  open,
  onOpenChange,
  describedBy,
}: {
  delayDuration?: number;
  closeDelay?: number;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  describedBy?: string;
}) {
  return (
    <>
      <p id="shortcut-help">标题会显示快捷键说明</p>
      <Tooltip.Root
        defaultOpen={open === undefined ? defaultOpen : undefined}
        open={open}
        onOpenChange={onOpenChange}
        delayDuration={delayDuration}
        closeDelay={closeDelay}
      >
        <Tooltip.Trigger>
          <Button aria-describedby={describedBy}>发布</Button>
        </Tooltip.Trigger>
        <Tooltip.Content>⌘ Enter 立即发布</Tooltip.Content>
      </Tooltip.Root>
    </>
  );
}

function TooltipGroupExample({
  delayDuration = 0,
  closeDelay = 0,
}: {
  delayDuration?: number;
  closeDelay?: number;
}) {
  return (
    <Tooltip.Group
      side="bottom"
      delayDuration={delayDuration}
      closeDelay={closeDelay}
    >
      <Tooltip.Item value="left" content="埃米尔·科瓦尔斯基的标签页">
        <Button>左侧标签</Button>
      </Tooltip.Item>
      <Tooltip.Item value="middle" content="Components - Oat UI">
        <Button>中间标签</Button>
      </Tooltip.Item>
      <Tooltip.Item value="right" content="toss/overlay-kit">
        <Button>右侧标签</Button>
      </Tooltip.Item>
    </Tooltip.Group>
  );
}

function rect(
  input: Partial<DOMRect> & Pick<DOMRect, "top" | "left">,
): DOMRect {
  const width = input.width ?? 120;
  const height = input.height ?? 40;

  return {
    x: input.left,
    y: input.top,
    top: input.top,
    left: input.left,
    width,
    height,
    right: input.right ?? input.left + width,
    bottom: input.bottom ?? input.top + height,
    toJSON: () => ({}),
  } as DOMRect;
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Tooltip", () => {
  it("opens after the configured focus delay and links the trigger", () => {
    vi.useFakeTimers();
    render(<TooltipExample delayDuration={120} />);

    const trigger = screen.getByRole("button", { name: "发布" });

    fireEvent.focus(trigger);
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(trigger.hasAttribute("aria-describedby")).toBe(false);

    act(() => {
      vi.advanceTimersByTime(120);
    });

    const tooltip = screen.getByRole("tooltip");

    expect(tooltip.textContent).toContain("⌘ Enter 立即发布");
    expect(trigger.getAttribute("aria-describedby")).toBe(tooltip.id);
  });

  it("merges existing aria-describedby values", () => {
    render(
      <TooltipExample delayDuration={0} open describedBy="shortcut-help" />,
    );

    const trigger = screen.getByRole("button", { name: "发布" });
    const tooltip = screen.getByRole("tooltip");

    expect(trigger.getAttribute("aria-describedby")).toBe(
      `shortcut-help ${tooltip.id}`,
    );
  });

  it("dismisses with Escape without taking focus from the trigger", () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    render(
      <TooltipExample delayDuration={0} open onOpenChange={onOpenChange} />,
    );

    const trigger = screen.getByRole("button", { name: "发布" });
    act(() => trigger.focus());

    const escape = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    fireEvent(trigger, escape);

    expect(escape.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(trigger);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("dismisses a hover-opened tooltip when Escape is pressed elsewhere", async () => {
    render(<TooltipExample defaultOpen delayDuration={0} closeDelay={0} />);

    expect(screen.getByRole("tooltip")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).toBeNull();
    });
  });

  it("closes after the configured leave delay", async () => {
    vi.useFakeTimers();
    render(<TooltipExample defaultOpen delayDuration={0} closeDelay={90} />);

    const trigger = screen.getByRole("button", { name: "发布" });

    expect(screen.getByRole("tooltip")).toBeTruthy();
    fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
    fireEvent.pointerLeave(trigger, { pointerType: "mouse" });

    await act(async () => {
      vi.advanceTimersByTime(90);
      await Promise.resolve();
    });

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("opens immediately for touch pointers", () => {
    render(<TooltipExample delayDuration={500} />);

    const trigger = screen.getByRole("button", { name: "发布" });
    fireEvent.pointerEnter(trigger, { pointerType: "touch" });

    expect(screen.getByRole("tooltip")).toBeTruthy();
  });

  it("closes after an outside pointer press", async () => {
    render(<TooltipExample defaultOpen delayDuration={0} closeDelay={0} />);

    expect(screen.getByRole("tooltip")).toBeTruthy();
    fireEvent.pointerDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).toBeNull();
    });
  });

  it("flips to the opposite side when the preferred side lacks room", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function getRect(this: HTMLElement) {
        if (this.classList.contains("uk-tooltip")) {
          return rect({ top: 0, left: 0, width: 160, height: 44 });
        }

        if (this.classList.contains("uk-button")) {
          return rect({ top: 4, left: 420, width: 120, height: 40 });
        }

        return rect({ top: 0, left: 0, width: 0, height: 0 });
      },
    );

    render(<TooltipExample defaultOpen delayDuration={0} />);

    const tooltip = screen.getByRole("tooltip");

    expect(tooltip.getAttribute("data-side")).toBe("bottom");
    expect((tooltip as HTMLElement).style.top).toBe("52px");
  });

  it("renders inside an ancestor dialog so it remains in the top layer", () => {
    render(
      <Dialog.Root defaultOpen>
        <Dialog.Content aria-label="发布设置">
          <Tooltip.Root defaultOpen delayDuration={0}>
            <Tooltip.Trigger>
              <Button>发布</Button>
            </Tooltip.Trigger>
            <Tooltip.Content>立即发布</Tooltip.Content>
          </Tooltip.Root>
        </Dialog.Content>
      </Dialog.Root>,
    );

    expect(
      screen.getByRole("dialog").querySelector('[role="tooltip"]'),
    ).toBeTruthy();
  });

  it("switches one shared tooltip between grouped triggers", () => {
    vi.useFakeTimers();
    render(<TooltipGroupExample delayDuration={120} closeDelay={90} />);

    const left = screen.getByRole("button", { name: "左侧标签" });
    const middle = screen.getByRole("button", { name: "中间标签" });

    fireEvent.pointerEnter(left, { pointerType: "mouse" });
    expect(screen.queryByRole("tooltip")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(120);
    });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.textContent).toContain("埃米尔·科瓦尔斯基的标签页");
    expect(left.getAttribute("aria-describedby")).toBe(tooltip.id);

    fireEvent.pointerLeave(left, { pointerType: "mouse" });
    fireEvent.pointerEnter(middle, { pointerType: "mouse" });

    expect(screen.getAllByRole("tooltip")).toHaveLength(1);
    expect(screen.getByRole("tooltip")).toBe(tooltip);
    expect(tooltip.textContent).toContain("Components - Oat UI");
    expect(middle.getAttribute("aria-describedby")).toBe(tooltip.id);
    expect(left.hasAttribute("aria-describedby")).toBe(false);
  });

  it("moves the shared grouped surface to the active trigger", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function getRect(this: HTMLElement) {
        if (this.classList.contains("uk-tooltip")) {
          return rect({ top: 0, left: 0, width: 140, height: 40 });
        }

        if (this.textContent === "左侧标签") {
          return rect({ top: 400, left: 100, width: 120, height: 40 });
        }

        if (this.textContent === "中间标签") {
          return rect({ top: 400, left: 300, width: 120, height: 40 });
        }

        return rect({ top: 0, left: 0, width: 0, height: 0 });
      },
    );
    render(<TooltipGroupExample />);

    const left = screen.getByRole("button", { name: "左侧标签" });
    const middle = screen.getByRole("button", { name: "中间标签" });

    fireEvent.pointerEnter(left, { pointerType: "mouse" });
    expect((screen.getByRole("tooltip") as HTMLElement).style.left).toBe(
      "90px",
    );

    fireEvent.pointerEnter(middle, { pointerType: "mouse" });
    expect((screen.getByRole("tooltip") as HTMLElement).style.left).toBe(
      "290px",
    );
  });

  it("switches grouped content with keyboard focus", () => {
    render(<TooltipGroupExample />);

    const left = screen.getByRole("button", { name: "左侧标签" });
    const middle = screen.getByRole("button", { name: "中间标签" });

    fireEvent.focus(left);
    expect(screen.getByRole("tooltip").textContent).toContain(
      "埃米尔·科瓦尔斯基的标签页",
    );

    fireEvent.blur(left);
    fireEvent.focus(middle);
    expect(screen.getByRole("tooltip").textContent).toContain(
      "Components - Oat UI",
    );
  });

  it("keeps a grouped tooltip open while moving between items", () => {
    vi.useFakeTimers();
    render(<TooltipGroupExample delayDuration={0} closeDelay={80} />);

    const left = screen.getByRole("button", { name: "左侧标签" });
    const middle = screen.getByRole("button", { name: "中间标签" });

    fireEvent.pointerEnter(left, { pointerType: "mouse" });
    fireEvent.pointerLeave(left, { pointerType: "mouse" });
    fireEvent.pointerEnter(middle, { pointerType: "mouse" });

    act(() => {
      vi.advanceTimersByTime(80);
    });

    expect(screen.getByRole("tooltip").textContent).toContain(
      "Components - Oat UI",
    );
  });
});
