import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "../Switch";

function ControlledSwitch() {
  const [checked, setChecked] = useState(false);

  return (
    <Switch checked={checked} onCheckedChange={setChecked}>
      启用通知
    </Switch>
  );
}

describe("Switch", () => {
  it("toggles uncontrolled state", () => {
    render(<Switch>启用通知</Switch>);

    const control = screen.getByRole("switch", { name: "启用通知" });

    expect((control as HTMLInputElement).checked).toBe(false);

    fireEvent.click(control);
    expect((control as HTMLInputElement).checked).toBe(true);
    expect(control.getAttribute("aria-checked")).toBe("true");

    fireEvent.click(control);
    expect((control as HTMLInputElement).checked).toBe(false);
  });

  it("works as a controlled component", () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();

    render(
      <Switch checked={false} onCheckedChange={onCheckedChange}>
        自动保存
      </Switch>,
    );

    const control = screen.getByRole("switch", { name: "自动保存" });

    fireEvent.click(control);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect((control as HTMLInputElement).checked).toBe(false);
  });

  it("updates through a controlled wrapper", () => {
    render(<ControlledSwitch />);

    const control = screen.getByRole("switch", { name: "启用通知" });

    fireEvent.click(control);

    expect((control as HTMLInputElement).checked).toBe(true);
  });

  it("does not change while disabled", () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();

    render(
      <Switch disabled onCheckedChange={onCheckedChange}>
        禁用开关
      </Switch>,
    );

    const control = screen.getByRole("switch", { name: "禁用开关" });

    act(() => {
      (control as HTMLInputElement).click();
    });

    expect((control as HTMLInputElement).disabled).toBe(true);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("supports pointer dragging with a velocity-aware release", () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();

    render(
      <Switch checked={false} onCheckedChange={onCheckedChange}>
        拖拽开关
      </Switch>,
    );

    const track = document.querySelector(".uk-switch__track");

    if (!(track instanceof HTMLElement)) {
      throw new Error("switch track not rendered");
    }

    Object.defineProperty(track, "setPointerCapture", {
      configurable: true,
      value: vi.fn<() => void>(),
    });
    Object.defineProperty(track, "hasPointerCapture", {
      configurable: true,
      value: vi.fn<() => boolean>(() => true),
    });
    Object.defineProperty(track, "releasePointerCapture", {
      configurable: true,
      value: vi.fn<() => void>(),
    });

    fireEvent.pointerDown(track, { pointerId: 1, clientX: 0 });
    fireEvent.pointerMove(track, { pointerId: 1, clientX: 20 });
    fireEvent.pointerUp(track, { pointerId: 1, clientX: 20 });

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
