import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "../Dialog";

function getDialog(): HTMLDialogElement {
  const dialog = document.querySelector("dialog");

  if (!dialog) {
    throw new Error("dialog not rendered");
  }

  return dialog;
}

function Harness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        打开
      </button>
      <Dialog open={open} onOpenChange={setOpen} title="受控对话框">
        内容
      </Dialog>
    </>
  );
}

function FocusHarness() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        打开
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="编辑"
        initialFocusRef={inputRef}
      >
        <input ref={inputRef} aria-label="名称" />
      </Dialog>
    </>
  );
}

function ComposableHarness() {
  return (
    <Dialog.Root defaultOpen>
      <Dialog.Trigger>
        <button type="button">打开组合对话框</button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>组合标题</Dialog.Title>
          <Dialog.Description>组合描述</Dialog.Description>
          <Dialog.Close>
            <button type="button" aria-label="关闭组合对话框">
              ×
            </button>
          </Dialog.Close>
        </Dialog.Header>
        <Dialog.Body>组合正文</Dialog.Body>
        <Dialog.Footer>
          <Dialog.Close>
            <button type="button">取消</button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}

describe("Dialog", () => {
  it("renders in a portal and opens with the open prop", () => {
    const { container } = render(
      <Dialog open onOpenChange={() => {}} title="确认发布">
        内容
      </Dialog>,
    );

    expect(container.querySelector("dialog")).toBeNull();

    const dialog = getDialog();

    expect(dialog.hasAttribute("open")).toBe(true);
    expect(screen.getByRole("heading", { name: "确认发布" })).toBeTruthy();
  });

  it("requests close from the close button", () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <Dialog open onOpenChange={onOpenChange} title="确认发布">
        内容
      </Dialog>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("requests close when the browser fires the close event", () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <Dialog open onOpenChange={onOpenChange} title="确认发布">
        内容
      </Dialog>,
    );

    act(() => {
      getDialog().dispatchEvent(new Event("close"));
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes when the backdrop is clicked", () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <Dialog open onOpenChange={onOpenChange} title="确认发布">
        内容
      </Dialog>,
    );

    fireEvent.click(getDialog());

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("can disable escape and backdrop closing", () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <Dialog
        open
        onOpenChange={onOpenChange}
        closeOnEscape={false}
        closeOnBackdropClick={false}
        title="确认发布"
      >
        内容
      </Dialog>,
    );

    const cancel = new Event("cancel", { cancelable: true });

    act(() => {
      getDialog().dispatchEvent(cancel);
    });

    expect(cancel.defaultPrevented).toBe(true);

    fireEvent.click(getDialog());
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("stays open when escape closing is disabled and Escape is pressed twice", () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <Dialog
        open
        onOpenChange={onOpenChange}
        closeOnEscape={false}
        closeOnBackdropClick={false}
        title="不可关闭"
      >
        内容
      </Dialog>,
    );

    const dialog = getDialog();

    for (let press = 0; press < 2; press += 1) {
      act(() => {
        const keyDown = new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        });
        const cancel = new Event("cancel", { cancelable: true });

        dialog.dispatchEvent(keyDown);
        dialog.dispatchEvent(cancel);

        expect(keyDown.defaultPrevented).toBe(true);
        expect(cancel.defaultPrevented).toBe(true);
      });
    }

    // Some browsers can still complete the native close after repeated Esc.
    act(() => {
      dialog.close();
    });

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(dialog.open).toBe(true);
  });

  it("removes the dialog when the prop turns false without echoing", async () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    const { rerender } = render(
      <Dialog open onOpenChange={onOpenChange} title="确认发布">
        内容
      </Dialog>,
    );

    expect(getDialog().hasAttribute("open")).toBe(true);

    rerender(
      <Dialog open={false} onOpenChange={onOpenChange} title="确认发布">
        内容
      </Dialog>,
    );

    await waitFor(() => {
      expect(document.querySelector("dialog")).toBeNull();
    });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("locks body scrolling while visible", async () => {
    const { rerender } = render(
      <Dialog open onOpenChange={() => {}} title="确认发布">
        内容
      </Dialog>,
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Dialog open={false} onOpenChange={() => {}} title="确认发布">
        内容
      </Dialog>,
    );

    await waitFor(() => {
      expect(document.body.style.overflow).toBe("");
    });
  });

  it("supports fully controlled open state", async () => {
    render(<Harness />);

    expect(document.querySelector("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "打开" }));
    expect(getDialog().hasAttribute("open")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(document.querySelector("dialog")).toBeNull();
    });
  });

  it("focuses initialFocusRef when opened", () => {
    render(<FocusHarness />);
    fireEvent.click(screen.getByRole("button", { name: "打开" }));

    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: "名称" }),
    );
  });

  it("supports semantic composition with linked trigger and content", async () => {
    render(<ComposableHarness />);

    const trigger = screen.getByRole("button", { name: "打开组合对话框" });
    const dialog = screen.getByRole("dialog", { name: "组合标题" });
    const title = screen.getByRole("heading", { name: "组合标题" });
    const description = screen.getByText("组合描述");

    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(dialog.id);
    expect(dialog.getAttribute("aria-labelledby")).toBe(title.id);
    expect(dialog.getAttribute("aria-describedby")).toBe(description.id);
    expect(dialog.querySelector("header")).toBeTruthy();
    expect(dialog.querySelector("footer")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "取消" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens and closes composed dialogs without a controlled prop", async () => {
    render(
      <Dialog.Root>
        <Dialog.Trigger>
          <button type="button">打开非受控</button>
        </Dialog.Trigger>
        <Dialog.Content aria-label="非受控对话框">
          <Dialog.Body>内容</Dialog.Body>
        </Dialog.Content>
      </Dialog.Root>,
    );

    const trigger = screen.getByRole("button", { name: "打开非受控" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "非受控对话框" })).toBeTruthy();
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("restores focus to the opener after closing", async () => {
    render(<Harness />);

    const trigger = screen.getByRole("button", { name: "打开" });
    act(() => {
      trigger.focus();
    });

    fireEvent.click(trigger);
    expect(document.activeElement).not.toBe(trigger);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });
});
