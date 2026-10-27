import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "../RadioGroup";

describe("RadioGroup", () => {
  it("renders a radiogroup with vertical orientation by default", () => {
    render(
      <RadioGroup aria-label="Test">
        <RadioGroupItem value="a" label="A" />
      </RadioGroup>,
    );
    const group = screen.getByRole("radiogroup");
    expect(group.getAttribute("aria-orientation")).toBe("vertical");
    expect(group.getAttribute("aria-label")).toBe("Test");
  });

  it("applies horizontal orientation", () => {
    render(
      <RadioGroup aria-label="Test" orientation="horizontal">
        <RadioGroupItem value="a" label="A" />
      </RadioGroup>,
    );
    expect(
      screen.getByRole("radiogroup").getAttribute("aria-orientation"),
    ).toBe("horizontal");
  });

  it("forwards group className and rest props", () => {
    render(
      <RadioGroup aria-label="Test" className="custom" data-testid="group">
        <RadioGroupItem value="a" label="A" />
      </RadioGroup>,
    );
    const group = screen.getByTestId("group");
    expect(group.classList.contains("radio-group")).toBe(true);
    expect(group.classList.contains("custom")).toBe(true);
  });

  it("merges item className without removing internal classes", () => {
    render(
      <RadioGroup aria-label="Test">
        <RadioGroupItem value="a" label="A" className="item-custom" />
      </RadioGroup>,
    );
    const item = document.querySelector(".radio-group-item");
    expect(item?.classList.contains("item-custom")).toBe(true);
  });

  it("uses consumer item id for input/label association", () => {
    render(
      <RadioGroup aria-label="Test">
        <RadioGroupItem value="a" label="A" id="my-radio" />
      </RadioGroup>,
    );
    const input = document.getElementById("my-radio") as HTMLInputElement;
    const label = document.querySelector("label");
    expect(input).not.toBeNull();
    expect(label?.getAttribute("for")).toBe("my-radio");
  });

  it("generates unique IDs when item id is absent", () => {
    render(
      <RadioGroup aria-label="Test">
        <RadioGroupItem value="a" label="A" />
        <RadioGroupItem value="b" label="B" />
      </RadioGroup>,
    );
    const inputs = document.querySelectorAll("input[type=radio]");
    expect(inputs[0].id).not.toBe(inputs[1].id);
    expect(inputs[0].id).toBeTruthy();
  });

  it("forwards native input props", () => {
    render(
      <RadioGroup aria-label="Test">
        <RadioGroupItem
          value="a"
          label="A"
          name="choice"
          required
          aria-invalid="true"
        />
      </RadioGroup>,
    );
    const input = screen.getByRole("radio") as HTMLInputElement;
    expect(input.name).toBe("choice");
    expect(input.required).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("defaultValue selects the matching item initially", () => {
    render(
      <RadioGroup aria-label="Test" defaultValue="b">
        <RadioGroupItem value="a" label="A" />
        <RadioGroupItem value="b" label="B" />
      </RadioGroup>,
    );
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios[0].checked).toBe(false);
    expect(radios[1].checked).toBe(true);
  });

  it("clicking an unselected item updates uncontrolled state", () => {
    render(
      <RadioGroup aria-label="Test" defaultValue="a">
        <RadioGroupItem value="a" label="A" />
        <RadioGroupItem value="b" label="B" />
      </RadioGroup>,
    );
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    fireEvent.click(radios[1]);
    expect(radios[1].checked).toBe(true);
    expect(radios[0].checked).toBe(false);
  });

  it("clicking the selected item does not clear it or emit duplicate change", () => {
    const onValueChange = vi.fn<(value: string) => void>();
    render(
      <RadioGroup
        aria-label="Test"
        defaultValue="a"
        onValueChange={onValueChange}
      >
        <RadioGroupItem value="a" label="A" />
        <RadioGroupItem value="b" label="B" />
      </RadioGroup>,
    );
    const radio = screen.getAllByRole("radio")[0] as HTMLInputElement;
    fireEvent.click(radio);
    expect(radio.checked).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("controlled value determines checked item after rerenders", () => {
    const { rerender } = render(
      <RadioGroup aria-label="Test" value="a">
        <RadioGroupItem value="a" label="A" />
        <RadioGroupItem value="b" label="B" />
      </RadioGroup>,
    );
    let radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios[0].checked).toBe(true);
    rerender(
      <RadioGroup aria-label="Test" value="b">
        <RadioGroupItem value="a" label="A" />
        <RadioGroupItem value="b" label="B" />
      </RadioGroup>,
    );
    radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios[1].checked).toBe(true);
    expect(radios[0].checked).toBe(false);
  });

  it("controlled selection calls onValueChange with new value", () => {
    const onValueChange = vi.fn<(value: string) => void>();
    render(
      <RadioGroup aria-label="Test" value="a" onValueChange={onValueChange}>
        <RadioGroupItem value="a" label="A" />
        <RadioGroupItem value="b" label="B" />
      </RadioGroup>,
    );
    fireEvent.click(screen.getAllByRole("radio")[1]);
    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  it("controlled group does not visually commit a rejected change", () => {
    render(
      <RadioGroup aria-label="Test" value="a" onValueChange={() => {}}>
        <RadioGroupItem value="a" label="A" />
        <RadioGroupItem value="b" label="B" />
      </RadioGroup>,
    );
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    fireEvent.click(radios[1]);
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
  });

  it("unmatched default value renders no selected item", () => {
    render(
      <RadioGroup aria-label="Test" defaultValue="z">
        <RadioGroupItem value="a" label="A" />
        <RadioGroupItem value="b" label="B" />
      </RadioGroup>,
    );
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios.every((r) => !r.checked)).toBe(true);
  });

  it("selecting by clicking the visible label works", () => {
    render(
      <RadioGroup aria-label="Test">
        <RadioGroupItem value="a" label="Click me" />
      </RadioGroup>,
    );
    fireEvent.click(screen.getByText("Click me"));
    expect((screen.getByRole("radio") as HTMLInputElement).checked).toBe(true);
  });

  it("description is referenced by aria-describedby", () => {
    render(
      <RadioGroup aria-label="Test">
        <RadioGroupItem value="a" label="A" description="Help text" />
      </RadioGroup>,
    );
    const input = screen.getByRole("radio");
    const desc = screen.getByText("Help text");
    expect(input.getAttribute("aria-describedby")).toBe(desc.id);
  });

  it("items without descriptions do not receive dangling description ID", () => {
    render(
      <RadioGroup aria-label="Test">
        <RadioGroupItem value="a" label="A" />
      </RadioGroup>,
    );
    expect(
      screen.getByRole("radio").getAttribute("aria-describedby"),
    ).toBeNull();
  });

  it("existing consumer aria-describedby values are preserved and merged", () => {
    render(
      <RadioGroup aria-label="Test">
        <RadioGroupItem
          value="a"
          label="A"
          description="Desc"
          aria-describedby="external-id"
        />
      </RadioGroup>,
    );
    const input = screen.getByRole("radio");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toContain("external-id");
    expect(describedBy).toContain(screen.getByText("Desc").id);
  });

  it("description removal updates accessibility relationship", () => {
    const { rerender } = render(
      <RadioGroup aria-label="Test">
        <RadioGroupItem value="a" label="A" description="Desc" />
      </RadioGroup>,
    );
    expect(
      screen.getByRole("radio").getAttribute("aria-describedby"),
    ).not.toBeNull();
    rerender(
      <RadioGroup aria-label="Test">
        <RadioGroupItem value="a" label="A" />
      </RadioGroup>,
    );
    expect(
      screen.getByRole("radio").getAttribute("aria-describedby"),
    ).toBeNull();
  });

  it("group accessible name resolves from aria-labelledby", () => {
    render(
      <>
        <span id="group-label">My Group</span>
        <RadioGroup aria-labelledby="group-label">
          <RadioGroupItem value="a" label="A" />
        </RadioGroup>
      </>,
    );
    expect(screen.getByRole("radiogroup").getAttribute("aria-labelledby")).toBe(
      "group-label",
    );
  });

  it("visual track and indicator are hidden from assistive technology", () => {
    render(
      <RadioGroup aria-label="Test" defaultValue="a">
        <RadioGroupItem value="a" label="A" />
      </RadioGroup>,
    );
    const track = document.querySelector(".radio-group-track");
    expect(track?.getAttribute("aria-hidden")).toBe("true");
  });

  it("disabled items expose native disabled state", () => {
    render(
      <RadioGroup aria-label="Test">
        <RadioGroupItem value="a" label="A" disabled />
      </RadioGroup>,
    );
    expect((screen.getByRole("radio") as HTMLInputElement).disabled).toBe(true);
  });

  it("throws when item rendered outside a group", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<RadioGroupItem value="a" label="A" />)).toThrow(
      "must be rendered inside <RadioGroup>",
    );
    spy.mockRestore();
  });

  it("empty group renders without crashing", () => {
    render(<RadioGroup aria-label="Empty" />);
    expect(screen.getByRole("radiogroup")).not.toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
  });

  it("all-disabled groups have no tabbable radio", () => {
    render(
      <RadioGroup aria-label="Test">
        <RadioGroupItem value="a" label="A" disabled />
        <RadioGroupItem value="b" label="B" disabled />
      </RadioGroup>,
    );
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios.every((r) => r.disabled)).toBe(true);
  });

  it("arrow keys move focus and selection together in vertical group", () => {
    const onValueChange = vi.fn<(value: string) => void>();
    render(
      <RadioGroup
        aria-label="Test"
        defaultValue="a"
        onValueChange={onValueChange}
      >
        <RadioGroupItem value="a" label="A" />
        <RadioGroupItem value="b" label="B" />
        <RadioGroupItem value="c" label="C" />
      </RadioGroup>,
    );
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    radios[0].focus();
    fireEvent.keyDown(radios[0], { key: "ArrowDown" });
    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  it("arrow keys wrap from last to first", () => {
    const onValueChange = vi.fn<(value: string) => void>();
    render(
      <RadioGroup
        aria-label="Test"
        defaultValue="c"
        onValueChange={onValueChange}
      >
        <RadioGroupItem value="a" label="A" />
        <RadioGroupItem value="b" label="B" />
        <RadioGroupItem value="c" label="C" />
      </RadioGroup>,
    );
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    fireEvent.keyDown(radios[2], { key: "ArrowDown" });
    expect(onValueChange).toHaveBeenCalledWith("a");
  });

  it("disabled items are skipped in keyboard navigation", () => {
    const onValueChange = vi.fn<(value: string) => void>();
    render(
      <RadioGroup
        aria-label="Test"
        defaultValue="a"
        onValueChange={onValueChange}
      >
        <RadioGroupItem value="a" label="A" />
        <RadioGroupItem value="b" label="B" disabled />
        <RadioGroupItem value="c" label="C" />
      </RadioGroup>,
    );
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    fireEvent.keyDown(radios[0], { key: "ArrowDown" });
    expect(onValueChange).toHaveBeenCalledWith("c");
  });

  it("horizontal group handles ArrowRight", () => {
    const onValueChange = vi.fn<(value: string) => void>();
    render(
      <RadioGroup
        aria-label="Test"
        orientation="horizontal"
        defaultValue="a"
        onValueChange={onValueChange}
      >
        <RadioGroupItem value="a" label="A" />
        <RadioGroupItem value="b" label="B" />
      </RadioGroup>,
    );
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    fireEvent.keyDown(radios[0], { key: "ArrowRight" });
    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  it("unrelated arrow keys are not handled", () => {
    const onValueChange = vi.fn<(value: string) => void>();
    render(
      <RadioGroup
        aria-label="Test"
        defaultValue="a"
        onValueChange={onValueChange}
      >
        <RadioGroupItem value="a" label="A" />
        <RadioGroupItem value="b" label="B" />
      </RadioGroup>,
    );
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    fireEvent.keyDown(radios[0], { key: "ArrowRight" });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("selected value participates in native form submission", () => {
    render(
      <form data-testid="form">
        <RadioGroup aria-label="Test" defaultValue="b">
          <RadioGroupItem value="a" label="A" name="choice" />
          <RadioGroupItem value="b" label="B" name="choice" />
        </RadioGroup>
      </form>,
    );
    const form = screen.getByTestId("form") as HTMLFormElement;
    const data = new FormData(form);
    expect(data.get("choice")).toBe("b");
  });

  it("multiple groups have isolated indicators", () => {
    render(
      <>
        <RadioGroup aria-label="Group 1" defaultValue="a">
          <RadioGroupItem value="a" label="A" />
          <RadioGroupItem value="b" label="B" />
        </RadioGroup>
        <RadioGroup aria-label="Group 2" defaultValue="x">
          <RadioGroupItem value="x" label="X" />
          <RadioGroupItem value="y" label="Y" />
        </RadioGroup>
      </>,
    );
    const indicators = document.querySelectorAll(".radio-group-indicator");
    expect(indicators.length).toBe(2);
  });

  it("single item renders indicator without shared layout", () => {
    render(
      <RadioGroup aria-label="Test" defaultValue="a">
        <RadioGroupItem value="a" label="A" />
      </RadioGroup>,
    );
    expect(document.querySelector(".radio-group-indicator")).not.toBeNull();
  });

  it("selected item unmount cleans up without throwing", () => {
    const { rerender } = render(
      <RadioGroup aria-label="Test" defaultValue="a">
        <RadioGroupItem value="a" label="A" />
        <RadioGroupItem value="b" label="B" />
      </RadioGroup>,
    );
    rerender(
      <RadioGroup aria-label="Test" defaultValue="a">
        <RadioGroupItem value="b" label="B" />
      </RadioGroup>,
    );
    expect(screen.getAllByRole("radio").length).toBe(1);
  });

  it("duplicate values produce development warning", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <RadioGroup aria-label="Test">
        <RadioGroupItem value="a" label="A" />
        <RadioGroupItem value="a" label="A2" />
      </RadioGroup>,
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("duplicate"));
    spy.mockRestore();
  });
});
