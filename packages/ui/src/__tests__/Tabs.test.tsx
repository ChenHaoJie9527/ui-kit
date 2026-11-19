import { createRef, useState, type ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Tabs } from "../Tabs";

function TabsExample({
  orientation,
  onValueChange,
  variant,
}: {
  orientation?: "horizontal" | "vertical";
  onValueChange?: (value: string) => void;
  variant?: "line" | "card" | "segmented";
}) {
  return (
    <Tabs
      defaultValue="overview"
      orientation={orientation}
      onValueChange={onValueChange}
      variant={variant}
    >
      <Tabs.List aria-label="文档">
        <Tabs.Trigger value="overview">概览</Tabs.Trigger>
        <Tabs.Trigger value="api">API</Tabs.Trigger>
        <Tabs.Trigger value="a11y">可访问性</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview">概览内容</Tabs.Content>
      <Tabs.Content value="api">API 内容</Tabs.Content>
      <Tabs.Content value="a11y">可访问性内容</Tabs.Content>
    </Tabs>
  );
}

function panelFor(tab: HTMLElement): HTMLElement {
  const id = tab.getAttribute("aria-controls");
  const panel = id ? document.getElementById(id) : null;

  if (!panel) {
    throw new Error("tab panel not found");
  }

  return panel;
}

const CLOSABLE_LABELS: Record<string, string> = {
  overview: "概览",
  api: "API",
  a11y: "可访问性",
};

function ClosableTabsExample({ action }: { action?: ReactNode }) {
  const [values, setValues] = useState(["overview", "api", "a11y"]);

  return (
    <Tabs defaultValue="overview">
      <Tabs.List aria-label="可编辑文档" action={action}>
        {values.map((value) => (
          <Tabs.Trigger
            key={value}
            value={value}
            onClose={() =>
              setValues((current) => current.filter((item) => item !== value))
            }
          >
            {CLOSABLE_LABELS[value]}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {values.map((value) => (
        <Tabs.Content key={value} value={value}>
          {CLOSABLE_LABELS[value]}内容
        </Tabs.Content>
      ))}
    </Tabs>
  );
}

describe("Tabs", () => {
  it("selects the default tab and hides the other panels", () => {
    render(<TabsExample />);

    const overview = screen.getByRole("tab", { name: "概览" });
    const api = screen.getByRole("tab", { name: "API" });

    expect(overview.getAttribute("aria-selected")).toBe("true");
    expect(overview.getAttribute("tabindex")).toBe("0");
    expect(api.getAttribute("aria-selected")).toBe("false");
    expect(api.getAttribute("tabindex")).toBe("-1");

    expect(panelFor(overview).hidden).toBe(false);
    expect(panelFor(api).hidden).toBe(true);
  });

  it("wires aria-controls and aria-labelledby together", () => {
    render(<TabsExample />);

    const overview = screen.getByRole("tab", { name: "概览" });
    const panel = panelFor(overview);

    expect(overview.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(overview.id);
  });

  it("renders one shared fluid indicator for the selected tab", () => {
    render(<TabsExample />);

    const indicators = document.querySelectorAll(".uk-tabs__indicator");

    expect(indicators).toHaveLength(1);
    expect(
      screen
        .getByRole("tab", { name: "概览" })
        .querySelector(".uk-tabs__indicator"),
    ).toBe(indicators[0]);
  });

  it("switches panels on click", () => {
    const onValueChange = vi.fn<(value: string) => void>();
    render(<TabsExample onValueChange={onValueChange} />);

    const api = screen.getByRole("tab", { name: "API" });

    fireEvent.click(api);

    expect(onValueChange).toHaveBeenCalledWith("api");
    expect(panelFor(api).hidden).toBe(false);
    expect(panelFor(screen.getByRole("tab", { name: "概览" })).hidden).toBe(
      true,
    );
  });

  it("moves selection with arrow keys and wraps around", () => {
    render(<TabsExample />);

    const overview = screen.getByRole("tab", { name: "概览" });
    const api = screen.getByRole("tab", { name: "API" });
    const a11y = screen.getByRole("tab", { name: "可访问性" });

    overview.focus();
    fireEvent.keyDown(overview, { key: "ArrowRight" });

    expect(document.activeElement).toBe(api);
    expect(api.getAttribute("aria-selected")).toBe("true");

    fireEvent.keyDown(api, { key: "ArrowRight" });
    expect(document.activeElement).toBe(a11y);

    fireEvent.keyDown(a11y, { key: "ArrowRight" });
    expect(document.activeElement).toBe(overview);

    fireEvent.keyDown(overview, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(a11y);
  });

  it("supports Home and End", () => {
    render(<TabsExample />);

    const overview = screen.getByRole("tab", { name: "概览" });
    const a11y = screen.getByRole("tab", { name: "可访问性" });

    a11y.focus();
    fireEvent.keyDown(a11y, { key: "Home" });
    expect(document.activeElement).toBe(overview);

    fireEvent.keyDown(overview, { key: "End" });
    expect(document.activeElement).toBe(a11y);
  });

  it("only renders a close control when onClose is provided", () => {
    render(<TabsExample />);

    expect(document.querySelector(".uk-tabs__close")).toBeNull();
    expect(
      screen
        .getByRole("tab", { name: "概览" })
        .hasAttribute("aria-keyshortcuts"),
    ).toBe(false);
  });

  it("forwards the trigger ref to the tab button", () => {
    const ref = createRef<HTMLButtonElement>();

    render(
      <Tabs defaultValue="overview">
        <Tabs.List aria-label="文档">
          <Tabs.Trigger ref={ref} value="overview">
            概览
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="overview">概览内容</Tabs.Content>
      </Tabs>,
    );

    expect(ref.current).toBe(screen.getByRole("tab", { name: "概览" }));
  });

  it("closes from the close control without selecting the tab", () => {
    const onClose = vi.fn<() => void>();
    const onValueChange = vi.fn<(value: string) => void>();

    render(
      <Tabs defaultValue="overview" onValueChange={onValueChange}>
        <Tabs.List aria-label="文档">
          <Tabs.Trigger value="overview">概览</Tabs.Trigger>
          <Tabs.Trigger value="api" onClose={onClose}>
            API
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="overview">概览内容</Tabs.Content>
        <Tabs.Content value="api">API 内容</Tabs.Content>
      </Tabs>,
    );

    const api = screen.getByRole("tab", { name: "API" });
    const close = api.querySelector<HTMLElement>(".uk-tabs__close");

    expect(close).not.toBeNull();
    expect(api.getAttribute("aria-keyshortcuts")).toBe("Delete Backspace");

    fireEvent.click(close!);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole("tab", { name: "概览" }).getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("closes with Delete and Backspace", () => {
    const onClose = vi.fn<() => void>();

    render(
      <Tabs defaultValue="overview">
        <Tabs.List aria-label="文档">
          <Tabs.Trigger value="overview">概览</Tabs.Trigger>
          <Tabs.Trigger value="api" onClose={onClose}>
            API
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="overview">概览内容</Tabs.Content>
        <Tabs.Content value="api">API 内容</Tabs.Content>
      </Tabs>,
    );

    const api = screen.getByRole("tab", { name: "API" });

    api.focus();
    fireEvent.keyDown(api, { key: "Delete" });
    fireEvent.keyDown(api, { key: "Backspace" });

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(api.getAttribute("aria-selected")).toBe("false");
  });

  it("selects and focuses the adjacent tab after closing the active tab", async () => {
    render(<ClosableTabsExample />);

    const overview = screen.getByRole("tab", { name: "概览" });
    const close = overview.querySelector<HTMLElement>(".uk-tabs__close");

    fireEvent.click(close!);

    await waitFor(() => {
      const api = screen.getByRole("tab", { name: "API" });

      expect(api.getAttribute("aria-selected")).toBe("true");
      expect(document.activeElement).toBe(api);
    });
    expect(screen.queryByRole("tab", { name: "概览" })).toBeNull();
  });

  it("keeps the list action outside the tablist", () => {
    render(
      <ClosableTabsExample
        action={
          <button type="button" aria-label="新增页签">
            +
          </button>
        }
      />,
    );

    const list = screen.getByRole("tablist");
    const add = screen.getByRole("button", { name: "新增页签" });

    expect(list.parentElement?.classList.contains("uk-tabs__bar")).toBe(true);
    expect(add.closest('[role="tablist"]')).toBeNull();
    expect(list.querySelectorAll('[role="tab"]')).toHaveLength(3);
  });

  it.each(["line", "card", "segmented"] as const)(
    "uses vertical arrow keys for the %s variant",
    (variant) => {
      render(<TabsExample orientation="vertical" variant={variant} />);

      const overview = screen.getByRole("tab", { name: "概览" });
      const api = screen.getByRole("tab", { name: "API" });

      overview.focus();
      fireEvent.keyDown(overview, { key: "ArrowDown" });
      expect(document.activeElement).toBe(api);

      fireEvent.keyDown(api, { key: "ArrowUp" });
      expect(document.activeElement).toBe(overview);
    },
  );

  it("defaults to the line variant", () => {
    render(<TabsExample />);

    expect(
      screen
        .getByRole("tablist")
        .closest(".uk-tabs")
        ?.getAttribute("data-variant"),
    ).toBe("line");
  });

  it.each(["line", "card", "segmented"] as const)(
    "keeps tab semantics and selection behavior for the %s variant",
    (variant) => {
      render(<TabsExample variant={variant} />);

      const list = screen.getByRole("tablist");
      const overview = screen.getByRole("tab", { name: "概览" });
      const api = screen.getByRole("tab", { name: "API" });

      expect(list.closest(".uk-tabs")?.getAttribute("data-variant")).toBe(
        variant,
      );
      expect(overview.getAttribute("aria-selected")).toBe("true");
      expect(panelFor(overview).hidden).toBe(false);

      fireEvent.click(api);

      expect(api.getAttribute("aria-selected")).toBe("true");
      expect(panelFor(api).hidden).toBe(false);
      expect(panelFor(overview).hidden).toBe(true);
    },
  );
});
