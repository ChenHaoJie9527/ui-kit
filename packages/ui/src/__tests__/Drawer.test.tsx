import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Drawer } from "../Drawer";

function getDrawer(): HTMLDialogElement {
  const drawer = document.querySelector<HTMLDialogElement>("dialog.uk-drawer");

  if (!drawer) {
    throw new Error("drawer not rendered");
  }

  return drawer;
}

function ComposableHarness() {
  return (
    <Drawer.Root defaultOpen>
      <Drawer.Trigger>
        <button type="button">打开筛选</button>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>筛选条件</Drawer.Title>
          <Drawer.Description>选择要应用的过滤条件。</Drawer.Description>
          <Drawer.Close>
            <button type="button" aria-label="关闭筛选">
              ×
            </button>
          </Drawer.Close>
        </Drawer.Header>
        <Drawer.Body>筛选正文</Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close>
            <button type="button">取消</button>
          </Drawer.Close>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer.Root>
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
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Content initialFocusRef={inputRef} aria-label="编辑">
          <Drawer.Header>
            <Drawer.Title>编辑</Drawer.Title>
            <Drawer.Close>
              <button type="button">关闭</button>
            </Drawer.Close>
          </Drawer.Header>
          <Drawer.Body>
            <input ref={inputRef} aria-label="名称" />
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>
    </>
  );
}

describe("Drawer", () => {
  it("renders in a portal and opens with the open prop", () => {
    const { container } = render(
      <Drawer.Root open onOpenChange={() => {}}>
        <Drawer.Content aria-label="筛选条件">
          <Drawer.Body>内容</Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>,
    );

    expect(container.querySelector("dialog")).toBeNull();

    const drawer = getDrawer();

    expect(drawer.hasAttribute("open")).toBe(true);
    expect(drawer.getAttribute("role")).toBeNull();
    expect(screen.getByRole("dialog", { name: "筛选条件" })).toBeTruthy();
  });

  it("applies side and size to the panel", () => {
    render(
      <Drawer.Root open onOpenChange={() => {}}>
        <Drawer.Content side="left" size="lg" aria-label="导航">
          <Drawer.Body>内容</Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>,
    );

    const panel = document.querySelector(".uk-drawer__panel");

    expect(panel?.getAttribute("data-side")).toBe("left");
    expect(panel?.getAttribute("data-size")).toBe("lg");
  });

  it("requests close from the close button", () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <Drawer.Root open onOpenChange={onOpenChange}>
        <Drawer.Content aria-label="筛选条件">
          <Drawer.Header>
            <Drawer.Title>筛选条件</Drawer.Title>
            <Drawer.Close />
          </Drawer.Header>
          <Drawer.Body>内容</Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("requests close when the browser fires the close event", () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <Drawer.Root open onOpenChange={onOpenChange}>
        <Drawer.Content aria-label="筛选条件">
          <Drawer.Body>内容</Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>,
    );

    act(() => {
      getDrawer().dispatchEvent(new Event("close"));
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes when the backdrop is clicked", () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <Drawer.Root open onOpenChange={onOpenChange}>
        <Drawer.Content aria-label="筛选条件">
          <Drawer.Body>内容</Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>,
    );

    fireEvent.click(getDrawer());

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("can disable escape and backdrop closing", () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <Drawer.Root open onOpenChange={onOpenChange}>
        <Drawer.Content
          closeOnEscape={false}
          closeOnBackdropClick={false}
          aria-label="筛选条件"
        >
          <Drawer.Body>内容</Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>,
    );

    const cancel = new Event("cancel", { cancelable: true });

    act(() => {
      getDrawer().dispatchEvent(cancel);
    });

    expect(cancel.defaultPrevented).toBe(true);

    fireEvent.click(getDrawer());
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("aligns native light dismiss with the close props", () => {
    const { rerender } = render(
      <Drawer.Root open onOpenChange={() => {}}>
        <Drawer.Content aria-label="筛选条件">
          <Drawer.Body>内容</Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>,
    );

    expect(getDrawer().getAttribute("closedby")).toBe("any");

    rerender(
      <Drawer.Root open onOpenChange={() => {}}>
        <Drawer.Content closeOnBackdropClick={false} aria-label="筛选条件">
          <Drawer.Body>内容</Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>,
    );

    expect(getDrawer().getAttribute("closedby")).toBe("closerequest");

    rerender(
      <Drawer.Root open onOpenChange={() => {}}>
        <Drawer.Content closeOnEscape={false} aria-label="筛选条件">
          <Drawer.Body>内容</Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>,
    );

    expect(getDrawer().getAttribute("closedby")).toBe("none");
  });

  it("stays open when escape closing is disabled and Escape is pressed twice", () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <Drawer.Root open onOpenChange={onOpenChange}>
        <Drawer.Content
          closeOnEscape={false}
          closeOnBackdropClick={false}
          aria-label="不可关闭"
        >
          <Drawer.Body>内容</Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>,
    );

    const drawer = getDrawer();

    for (let press = 0; press < 2; press += 1) {
      act(() => {
        const keyDown = new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        });
        const cancel = new Event("cancel", { cancelable: true });

        drawer.dispatchEvent(keyDown);
        drawer.dispatchEvent(cancel);

        expect(keyDown.defaultPrevented).toBe(true);
        expect(cancel.defaultPrevented).toBe(true);
      });
    }

    act(() => {
      drawer.close();
    });

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(drawer.open).toBe(true);
  });

  it("removes the drawer when the prop turns false without echoing", async () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    const { rerender } = render(
      <Drawer.Root open onOpenChange={onOpenChange}>
        <Drawer.Content aria-label="筛选条件">
          <Drawer.Body>内容</Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>,
    );

    expect(getDrawer().hasAttribute("open")).toBe(true);

    rerender(
      <Drawer.Root open={false} onOpenChange={onOpenChange}>
        <Drawer.Content aria-label="筛选条件">
          <Drawer.Body>内容</Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>,
    );

    await waitFor(() => {
      expect(document.querySelector("dialog")).toBeNull();
    });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("locks body scrolling while visible", async () => {
    const { rerender } = render(
      <Drawer.Root open onOpenChange={() => {}}>
        <Drawer.Content aria-label="筛选条件">
          <Drawer.Body>内容</Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>,
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Drawer.Root open={false} onOpenChange={() => {}}>
        <Drawer.Content aria-label="筛选条件">
          <Drawer.Body>内容</Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>,
    );

    await waitFor(() => {
      expect(document.body.style.overflow).toBe("");
    });
  });

  it("supports semantic composition with linked trigger and content", async () => {
    render(<ComposableHarness />);

    const trigger = screen.getByRole("button", { name: "打开筛选" });
    const drawer = screen.getByRole("dialog", { name: "筛选条件" });
    const title = screen.getByRole("heading", { name: "筛选条件" });
    const description = screen.getByText("选择要应用的过滤条件。");

    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(drawer.id);
    expect(drawer.getAttribute("aria-labelledby")).toBe(title.id);
    expect(drawer.getAttribute("aria-describedby")).toBe(description.id);
    expect(drawer.querySelector("header")).toBeTruthy();
    expect(drawer.querySelector("footer")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "取消" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens and closes composed drawers without a controlled prop", async () => {
    render(
      <Drawer.Root>
        <Drawer.Trigger>
          <button type="button">打开非受控</button>
        </Drawer.Trigger>
        <Drawer.Content aria-label="非受控抽屉">
          <Drawer.Body>内容</Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>,
    );

    const trigger = screen.getByRole("button", { name: "打开非受控" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "非受控抽屉" })).toBeTruthy();
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("focuses initialFocusRef when opened", () => {
    render(<FocusHarness />);
    fireEvent.click(screen.getByRole("button", { name: "打开" }));

    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: "名称" }),
    );
  });

  it("restores focus to the opener after closing", async () => {
    render(<FocusHarness />);

    const trigger = screen.getByRole("button", { name: "打开" });
    act(() => {
      trigger.focus();
    });

    fireEvent.click(trigger);
    expect(document.activeElement).not.toBe(trigger);

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });
});
