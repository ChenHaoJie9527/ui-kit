import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
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

  it("closes the native dialog when the prop turns false without echoing", () => {
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

    expect(getDialog().hasAttribute("open")).toBe(false);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("locks body scrolling while open", () => {
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

    expect(document.body.style.overflow).toBe("");
  });

  it("supports fully controlled open state", () => {
    render(<Harness />);

    expect(getDialog().hasAttribute("open")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "打开" }));
    expect(getDialog().hasAttribute("open")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(getDialog().hasAttribute("open")).toBe(false);
  });
});
