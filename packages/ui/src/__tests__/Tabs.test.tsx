import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Tabs } from "../Tabs";

function TabsExample({
  orientation,
  onValueChange,
}: {
  orientation?: "horizontal" | "vertical";
  onValueChange?: (value: string) => void;
}) {
  return (
    <Tabs
      defaultValue="overview"
      orientation={orientation}
      onValueChange={onValueChange}
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

  it("uses vertical arrow keys when orientation is vertical", () => {
    render(<TabsExample orientation="vertical" />);

    const overview = screen.getByRole("tab", { name: "概览" });
    const api = screen.getByRole("tab", { name: "API" });

    overview.focus();
    fireEvent.keyDown(overview, { key: "ArrowDown" });
    expect(document.activeElement).toBe(api);

    fireEvent.keyDown(api, { key: "ArrowUp" });
    expect(document.activeElement).toBe(overview);
  });
});
