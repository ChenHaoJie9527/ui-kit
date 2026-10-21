import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "../Sidebar";

function SidebarExample({
  active = "guide",
  hoverPreview = true,
  hoverIndicator = "rail",
  groupGap,
  onGuideEnter,
}: {
  active?: "guide" | "buttons";
  hoverPreview?: boolean;
  hoverIndicator?: "rail" | "background";
  groupGap?: number | string;
  onGuideEnter?: () => void;
}) {
  return (
    <Sidebar
      aria-label="文档导航"
      hoverPreview={hoverPreview}
      hoverIndicator={hoverIndicator}
      groupGap={groupGap}
    >
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

function CollapsibleGroupExample({
  open,
  onOpenChange,
  hoverIndicator = "rail",
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hoverIndicator?: "rail" | "background";
}) {
  return (
    <Sidebar aria-label="文档导航" hoverIndicator={hoverIndicator}>
      <Sidebar.Group
        title="开始"
        collapsible
        open={open}
        defaultOpen
        onOpenChange={onOpenChange}
      >
        <Sidebar.Item active>
          <a href="/guide">使用指南</a>
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

  it("configures the vertical Group gap", () => {
    const { rerender } = render(<SidebarExample groupGap={12} />);
    const navigation = screen.getByRole("navigation", { name: "文档导航" });

    expect(navigation.style.getPropertyValue("--uk-sidebar-group-gap")).toBe(
      "12px",
    );

    rerender(<SidebarExample groupGap="2.25rem" />);
    expect(navigation.style.getPropertyValue("--uk-sidebar-group-gap")).toBe(
      "2.25rem",
    );
  });

  it("uses only the rail indicator for the active item by default", () => {
    render(<SidebarExample />);

    const rail = document.querySelectorAll(
      '[data-slot="sidebar-active-rail-indicator"]',
    );

    expect(rail).toHaveLength(1);
    expect(
      screen
        .getByRole("link", { name: "使用指南" })
        .querySelector('[data-slot="sidebar-active-rail-indicator"]'),
    ).toBe(rail[0]);
    expect(
      document.querySelectorAll('[data-slot="sidebar-active-highlight"]'),
    ).toHaveLength(0);
    expect(
      document.querySelectorAll('[data-slot="sidebar-hover-highlight"]'),
    ).toHaveLength(0);
    expect(
      document.querySelectorAll('[data-slot="sidebar-hover-rail-indicator"]'),
    ).toHaveLength(0);
  });

  it("shows only the rail preview by default", async () => {
    render(<SidebarExample />);

    const guide = screen.getByRole("link", { name: "使用指南" });
    const buttons = screen.getByRole("link", { name: "按钮" });

    fireEvent.pointerEnter(buttons, { pointerType: "mouse" });

    expect(
      buttons.querySelector('[data-slot="sidebar-hover-highlight"]'),
    ).toBeNull();
    expect(
      buttons.querySelector('[data-slot="sidebar-hover-rail-indicator"]'),
    ).toBeTruthy();
    expect(
      guide.querySelector('[data-slot="sidebar-active-rail-indicator"]'),
    ).toBeTruthy();

    fireEvent.pointerLeave(buttons, { pointerType: "mouse" });

    await waitFor(() => {
      expect(
        document.querySelectorAll('[data-slot="sidebar-hover-highlight"]'),
      ).toHaveLength(0);
      expect(
        document.querySelectorAll('[data-slot="sidebar-hover-rail-indicator"]'),
      ).toHaveLength(0);
    });
  });

  it("shows only the background preview when hoverIndicator is background", () => {
    render(<SidebarExample hoverIndicator="background" />);

    const buttons = screen.getByRole("link", { name: "按钮" });

    fireEvent.pointerEnter(buttons, { pointerType: "mouse" });

    expect(
      buttons.querySelector('[data-slot="sidebar-hover-highlight"]'),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "使用指南" })
        .querySelector('[data-slot="sidebar-active-highlight"]'),
    ).toBeTruthy();
    expect(
      document.querySelectorAll('[data-slot="sidebar-active-rail-indicator"]'),
    ).toHaveLength(0);
    expect(
      buttons.querySelector('[data-slot="sidebar-hover-rail-indicator"]'),
    ).toBeNull();
  });

  it("does not create a hover preview for touch pointers", () => {
    render(<SidebarExample />);

    fireEvent.pointerEnter(screen.getByRole("link", { name: "按钮" }), {
      pointerType: "touch",
    });

    expect(
      document.querySelectorAll('[data-slot="sidebar-hover-highlight"]'),
    ).toHaveLength(0);
    expect(
      document.querySelectorAll('[data-slot="sidebar-hover-rail-indicator"]'),
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
          '[data-slot="sidebar-hover-rail-indicator"]',
        )?.style.opacity,
      ).toBe("1");
      expect(
        guide.querySelector<HTMLElement>(
          '[data-slot="sidebar-hover-rail-indicator"]',
        )?.style.opacity,
      ).toBe("0");
    });
    expect(
      guide.querySelector('[data-slot="sidebar-active-rail-indicator"]'),
    ).toBeTruthy();
  });

  it("retargets the background preview between items", async () => {
    render(<SidebarExample hoverIndicator="background" />);

    const guide = screen.getByRole("link", { name: "使用指南" });
    const buttons = screen.getByRole("link", { name: "按钮" });

    fireEvent.pointerEnter(guide, { pointerType: "mouse" });
    fireEvent.pointerEnter(buttons, { pointerType: "mouse" });

    await waitFor(() => {
      expect(
        buttons.querySelector<HTMLElement>(
          '[data-slot="sidebar-hover-highlight"]',
        )?.style.opacity,
      ).toBe("1");
      expect(
        guide.querySelector<HTMLElement>(
          '[data-slot="sidebar-hover-highlight"]',
        )?.style.opacity,
      ).toBe("0");
    });
    expect(
      document.querySelectorAll('[data-slot="sidebar-hover-rail-indicator"]'),
    ).toHaveLength(0);
  });

  it("allows hover preview to be disabled without removing active state", () => {
    render(<SidebarExample hoverPreview={false} />);

    fireEvent.pointerEnter(screen.getByRole("link", { name: "按钮" }), {
      pointerType: "mouse",
    });

    expect(
      document.querySelectorAll('[data-slot="sidebar-hover-highlight"]'),
    ).toHaveLength(0);
    expect(
      document.querySelectorAll('[data-slot="sidebar-hover-rail-indicator"]'),
    ).toHaveLength(0);
    expect(
      document.querySelectorAll('[data-slot="sidebar-active-rail-indicator"]'),
    ).toHaveLength(1);
  });

  it("collapses a group, hides its content semantics, and retains its links", () => {
    render(<CollapsibleGroupExample />);

    const trigger = screen.getByRole("button", { name: "开始" });
    const contentId = trigger.getAttribute("aria-controls");
    const content = contentId ? document.getElementById(contentId) : null;

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(content).toBeTruthy();
    expect(content?.hasAttribute("inert")).toBe(false);

    fireEvent.click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(content?.hasAttribute("inert")).toBe(true);
    expect(content?.getAttribute("aria-hidden")).toBe("true");
    expect(
      screen.getByRole("link", { name: "使用指南", hidden: true }),
    ).toBeTruthy();
  });

  it("keeps the Group hover free of background in rail mode", () => {
    render(<CollapsibleGroupExample />);

    const trigger = screen.getByRole("button", { name: "开始" });
    fireEvent.pointerEnter(trigger, { pointerType: "mouse" });

    expect(
      trigger.querySelector('[data-slot="sidebar-hover-highlight"]'),
    ).toBeNull();
  });

  it("moves the shared background from a Group into an Item", async () => {
    render(<CollapsibleGroupExample hoverIndicator="background" />);

    const trigger = screen.getByRole("button", { name: "开始" });
    const link = screen.getByRole("link", { name: "使用指南" });

    fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
    expect(
      trigger.querySelector('[data-slot="sidebar-hover-highlight"]'),
    ).toBeTruthy();

    fireEvent.pointerEnter(link, { pointerType: "mouse" });

    await waitFor(() => {
      expect(
        link.querySelector<HTMLElement>('[data-slot="sidebar-hover-highlight"]')
          ?.style.opacity,
      ).toBe("1");
      expect(
        trigger.querySelector<HTMLElement>(
          '[data-slot="sidebar-hover-highlight"]',
        )?.style.opacity,
      ).toBe("0");
    });
  });

  it("supports controlled group expansion", () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    render(
      <CollapsibleGroupExample open={false} onOpenChange={onOpenChange} />,
    );

    const trigger = screen.getByRole("button", { name: "开始" });

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("returns focus to the trigger when a controlled group closes", () => {
    const { rerender } = render(<CollapsibleGroupExample open />);
    const link = screen.getByRole("link", { name: "使用指南" });
    const trigger = screen.getByRole("button", { name: "开始" });

    link.focus();
    expect(document.activeElement).toBe(link);

    rerender(<CollapsibleGroupExample open={false} />);

    expect(document.activeElement).toBe(trigger);
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
