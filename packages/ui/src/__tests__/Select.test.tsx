import { act, render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Select } from "../Select";

const options = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "solid", label: "Solid", disabled: true },
  { value: "svelte", label: "Svelte" },
];

function openListbox() {
  const trigger = screen.getByRole("combobox", { name: "框架" });

  act(() => {
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
  });

  return trigger;
}

describe("Select", () => {
  it("renders the selected value and opens the linked listbox", () => {
    render(<Select options={options} defaultValue="vue" aria-label="框架" />);
    const trigger = screen.getByRole("combobox", { name: "框架" });

    expect(trigger.textContent).toContain("Vue");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    act(() => {
      fireEvent.keyDown(trigger, { key: "ArrowDown" });
    });
    const listbox = screen.getByRole("listbox", { name: "框架" });

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(listbox.id);
    expect(trigger.getAttribute("aria-activedescendant")).toBe(
      `${listbox.id}-option-1`,
    );
  });

  it("commits keyboard choices and returns focus to the trigger", async () => {
    const onValueChange = vi.fn<(value: string) => void>();
    render(
      <Select
        options={options}
        defaultValue="react"
        onValueChange={onValueChange}
        aria-label="框架"
      />,
    );
    const trigger = openListbox();

    act(() => {
      fireEvent.keyDown(trigger, { key: "ArrowDown" });
    });
    act(() => {
      fireEvent.keyDown(trigger, { key: "Enter" });
    });

    expect(onValueChange).toHaveBeenCalledWith("vue");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    await waitFor(() => {
      expect(trigger.textContent).toContain("Vue");
    });
  });

  it("does not commit disabled options", () => {
    const onValueChange = vi.fn<(value: string) => void>();
    render(
      <Select
        options={options}
        onValueChange={onValueChange}
        aria-label="框架"
      />,
    );
    const trigger = openListbox();
    const disabled = screen.getByRole("option", { name: "Solid" });

    fireEvent.click(disabled);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(trigger.getAttribute("aria-activedescendant")).not.toBe(
      `${screen.getByRole("listbox").id}-option-2`,
    );
  });

  it("supports typeahead while closed", () => {
    const onValueChange = vi.fn<(value: string) => void>();
    render(
      <Select
        options={options}
        onValueChange={onValueChange}
        aria-label="框架"
      />,
    );
    const trigger = screen.getByRole("combobox", { name: "框架" });

    act(() => {
      fireEvent.keyDown(trigger, { key: "v" });
    });

    expect(onValueChange).toHaveBeenCalledWith("vue");
  });

  it("clears the selected value from the clear button", () => {
    const onValueChange = vi.fn<(value: string) => void>();
    render(
      <Select
        clear
        options={options}
        defaultValue="react"
        onValueChange={onValueChange}
        aria-label="框架"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "清空" }));

    expect(onValueChange).toHaveBeenLastCalledWith("");
    expect(screen.getByText("请选择")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "清空" })).toBeNull();
  });

  it("retargets one shared highlight between hovered options", async () => {
    render(<Select options={options} aria-label="框架" />);
    const trigger = openListbox();
    const reactOption = screen.getByRole("option", { name: "React" });
    const vueOption = screen.getByRole("option", { name: "Vue" });

    fireEvent.pointerEnter(reactOption, { pointerType: "mouse" });
    expect(reactOption.getAttribute("data-active")).toBe("true");
    expect(
      reactOption.querySelector('[data-slot="select-active-highlight"]'),
    ).toBeTruthy();

    fireEvent.pointerEnter(vueOption, { pointerType: "mouse" });

    await waitFor(() => {
      expect(vueOption.getAttribute("data-active")).toBe("true");
      expect(
        vueOption.querySelector<HTMLElement>(
          '[data-slot="select-active-highlight"]',
        )?.style.opacity,
      ).toBe("1");
      expect(
        reactOption.querySelector<HTMLElement>(
          '[data-slot="select-active-highlight"]',
        )?.style.opacity,
      ).toBe("0");
    });
    expect(trigger.getAttribute("aria-activedescendant")).toBe(vueOption.id);
  });

  it("keeps a controlled value unchanged until the owner updates it", () => {
    const onValueChange = vi.fn<(value: string) => void>();
    render(
      <Select
        options={options}
        value="react"
        onValueChange={onValueChange}
        aria-label="框架"
      />,
    );
    const trigger = openListbox();

    act(() => {
      fireEvent.keyDown(trigger, { key: "ArrowDown" });
    });
    act(() => {
      fireEvent.keyDown(trigger, { key: "Enter" });
    });

    expect(onValueChange).toHaveBeenCalledWith("vue");
    expect(trigger.textContent).toContain("React");
  });

  it("closes on Escape and outside pointer press", async () => {
    render(<Select options={options} aria-label="框架" />);
    const trigger = openListbox();

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    await waitFor(() => {
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
    });

    act(() => {
      fireEvent.keyDown(trigger, { key: "ArrowDown" });
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    act(() => {
      fireEvent.pointerDown(document.body);
    });
    await waitFor(() => {
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
    });
  });

  it("shows the empty state without an empty listbox", () => {
    render(<Select options={[]} aria-label="框架" emptyText="暂无数据" />);
    const trigger = screen.getByRole("combobox", { name: "框架" });

    act(() => {
      fireEvent.keyDown(trigger, { key: "ArrowDown" });
    });

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByText("暂无数据")).toBeTruthy();
  });
});

describe("Select multiple", () => {
  it("clears all selected values from the clear button", () => {
    const onValueChange = vi.fn<(value: Array<string>) => void>();
    render(
      <Select
        multiple
        clear
        options={options}
        defaultValue={["react", "vue"]}
        onValueChange={onValueChange}
        aria-label="框架"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "清空" }));

    expect(onValueChange).toHaveBeenLastCalledWith([]);
    expect(screen.getByText("请选择")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "清空" })).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole("combobox", { name: "框架" }),
    );
  });

  it("renders selected values as removable tags", () => {
    render(
      <Select
        multiple
        options={options}
        defaultValue={["react", "vue"]}
        aria-label="框架"
      />,
    );
    const trigger = screen.getByRole("combobox", { name: "框架" });

    expect(screen.getByText("React")).toBeTruthy();
    expect(screen.getByText("Vue")).toBeTruthy();
    expect(screen.getByRole("button", { name: "移除 React" })).toBeTruthy();
    expect(trigger.getAttribute("data-multiple")).toBe("true");
  });

  it("toggles options and keeps the listbox open", async () => {
    const onValueChange = vi.fn<(value: Array<string>) => void>();
    render(
      <Select
        multiple
        options={options}
        onValueChange={onValueChange}
        aria-label="框架"
      />,
    );
    const trigger = openListbox();

    act(() => {
      fireEvent.keyDown(trigger, { key: "Enter" });
    });
    expect(onValueChange).toHaveBeenLastCalledWith(["react"]);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    act(() => {
      fireEvent.keyDown(trigger, { key: "ArrowDown" });
    });
    act(() => {
      fireEvent.keyDown(trigger, { key: "Enter" });
    });
    expect(onValueChange).toHaveBeenLastCalledWith(["react", "vue"]);

    await waitFor(() => {
      expect(
        screen
          .getByRole("option", { name: "Vue" })
          .getAttribute("aria-selected"),
      ).toBe("true");
      expect(screen.getByRole("button", { name: "移除 Vue" })).toBeTruthy();
    });
  });

  it("keeps a controlled multiple value until the owner updates it", () => {
    const onValueChange = vi.fn<(value: Array<string>) => void>();
    render(
      <Select
        multiple
        options={options}
        value={["react"]}
        onValueChange={onValueChange}
        aria-label="框架"
      />,
    );
    const trigger = openListbox();

    act(() => {
      fireEvent.keyDown(trigger, { key: "ArrowDown" });
    });
    act(() => {
      fireEvent.keyDown(trigger, { key: "Enter" });
    });

    expect(onValueChange).toHaveBeenCalledWith(["react", "vue"]);
    expect(screen.queryByRole("button", { name: "移除 Vue" })).toBeNull();
  });

  it("removes a tag from its button and the last tag with Backspace", async () => {
    const onValueChange = vi.fn<(value: Array<string>) => void>();
    render(
      <Select
        multiple
        options={options}
        defaultValue={["react", "vue"]}
        onValueChange={onValueChange}
        aria-label="框架"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "移除 React" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["vue"]);

    fireEvent.keyDown(screen.getByRole("combobox", { name: "框架" }), {
      key: "Backspace",
    });
    expect(onValueChange).toHaveBeenLastCalledWith([]);
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "移除 Vue" })).toBeNull();
    });
  });
});
