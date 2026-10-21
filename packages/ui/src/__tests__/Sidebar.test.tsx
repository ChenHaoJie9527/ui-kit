import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "../Sidebar";

function SidebarExample({
  active = "guide",
  hoverPreview = true,
  onGuideEnter,
}: {
  active?: "guide" | "buttons";
  hoverPreview?: boolean;
  onGuideEnter?: () => void;
}) {
  return (
    <Sidebar aria-label="文档导航" hoverPreview={hoverPreview}>
      <Sidebar.Group title="开始" icon={<span aria-hidden="true">+</span>}>
        <Sidebar.Item active={active === "guide"}>
          <a href="/guide" onPointerEnter={onGuideEnter}>
            使用指南
          </a>
        </Sidebar.Item>
      </Sidebar.Group>
      <Sidebar.Group title="组件">
        <Sidebar.Item active={active === "buttons"}>
          <a href="/buttons">按钮</a>
        </Sidebar.Item>
      </Sidebar.Group>
    </Sidebar>
  );
}

describe("Sidebar", () => {
  it("renders navigation groups, native links, and the current page", () => {
    render(<SidebarExample />);

    expect(screen.getByRole("navigation", { name: "文档导航" })).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "使用指南" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(
      screen.getByRole("link", { name: "按钮" }).hasAttribute("aria-current"),
    ).toBe(false);
    expect(screen.getByRole("region", { name: "开始" })).toBeTruthy();
  });

  it("renders one active indicator inside the current link", () => {
    render(<SidebarExample />);

    const active = document.querySelectorAll(
      '[data-slot="sidebar-active-indicator"]',
    );

    expect(active).toHaveLength(1);
    expect(
      screen
        .getByRole("link", { name: "使用指南" })
        .querySelector('[data-slot="sidebar-active-indicator"]'),
    ).toBe(active[0]);
    expect(
      document.querySelectorAll('[data-slot="sidebar-hover-indicator"]'),
    ).toHaveLength(0);
  });

  it("shows one mouse preview indicator independent from the active item", async () => {
    render(<SidebarExample />);

    const guide = screen.getByRole("link", { name: "使用指南" });
    const buttons = screen.getByRole("link", { name: "按钮" });

    fireEvent.pointerEnter(buttons, { pointerType: "mouse" });

    expect(
      buttons.querySelector('[data-slot="sidebar-hover-indicator"]'),
    ).toBeTruthy();
    expect(
      guide.querySelector('[data-slot="sidebar-active-indicator"]'),
    ).toBeTruthy();

    fireEvent.pointerLeave(buttons, { pointerType: "mouse" });

    await waitFor(() => {
      expect(
        document.querySelectorAll('[data-slot="sidebar-hover-indicator"]'),
      ).toHaveLength(0);
    });
  });

  it("does not create a hover preview for touch pointers", () => {
    render(<SidebarExample />);

    fireEvent.pointerEnter(screen.getByRole("link", { name: "按钮" }), {
      pointerType: "touch",
    });

    expect(
      document.querySelectorAll('[data-slot="sidebar-hover-indicator"]'),
    ).toHaveLength(0);
  });

  it("retargets the preview when the pointer moves directly between items", async () => {
    render(<SidebarExample />);

    const guide = screen.getByRole("link", { name: "使用指南" });
    const buttons = screen.getByRole("link", { name: "按钮" });

    fireEvent.pointerEnter(guide, { pointerType: "mouse" });
    fireEvent.pointerEnter(buttons, { pointerType: "mouse" });

    await waitFor(() => {
      expect(
        buttons.querySelector<HTMLElement>(
          '[data-slot="sidebar-hover-indicator"]',
        )?.style.opacity,
      ).toBe("1");
      expect(
        guide.querySelector<HTMLElement>(
          '[data-slot="sidebar-hover-indicator"]',
        )?.style.opacity,
      ).toBe("0");
    });
    expect(
      guide.querySelector('[data-slot="sidebar-active-indicator"]'),
    ).toBeTruthy();
  });

  it("allows hover preview to be disabled without removing active state", () => {
    render(<SidebarExample hoverPreview={false} />);

    fireEvent.pointerEnter(screen.getByRole("link", { name: "按钮" }), {
      pointerType: "mouse",
    });

    expect(
      document.querySelectorAll('[data-slot="sidebar-hover-indicator"]'),
    ).toHaveLength(0);
    expect(
      document.querySelectorAll('[data-slot="sidebar-active-indicator"]'),
    ).toHaveLength(1);
  });

  it("preserves the child link's event handlers and classes", () => {
    const onGuideEnter = vi.fn<() => void>();

    render(
      <Sidebar aria-label="文档导航">
        <Sidebar.Group title="开始">
          <Sidebar.Item className="custom-link">
            <a href="/guide" onPointerEnter={onGuideEnter}>
              使用指南
            </a>
          </Sidebar.Item>
        </Sidebar.Group>
      </Sidebar>,
    );

    const guide = screen.getByRole("link", { name: "使用指南" });

    fireEvent.pointerEnter(guide, { pointerType: "mouse" });

    expect(onGuideEnter).toHaveBeenCalledOnce();
    expect(guide.classList.contains("uk-sidebar__link")).toBe(true);
    expect(guide.classList.contains("custom-link")).toBe(true);
  });

  it("requires an Item to be rendered inside Sidebar", () => {
    expect(() =>
      render(
        <Sidebar.Item>
          <a href="/guide">使用指南</a>
        </Sidebar.Item>,
      ),
    ).toThrow("<Sidebar.Item> must be rendered inside <Sidebar>");
  });
});
