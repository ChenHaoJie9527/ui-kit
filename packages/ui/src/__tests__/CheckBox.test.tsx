import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckBox } from "../CheckBox";

describe("CheckBox", () => {
  it("toggles uncontrolled state", () => {
    render(<CheckBox>启用通知</CheckBox>);

    const control = screen.getByRole("checkbox", { name: "启用通知" });

    expect((control as HTMLInputElement).checked).toBe(false);

    act(() => {
      (control as HTMLInputElement).click();
    });
    expect((control as HTMLInputElement).checked).toBe(true);

    fireEvent.click(control);
    expect((control as HTMLInputElement).checked).toBe(false);
  });

  it("notifies about state changes in controlled and uncontrolled modes", () => {
    const controlledChange = vi.fn<(checked: boolean) => void>();

    render(
      <CheckBox checked={false} onCheckedChange={controlledChange}>
        自动保存
      </CheckBox>,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "自动保存" }));

    expect(controlledChange).toHaveBeenCalledWith(true);
    expect(
      (screen.getByRole("checkbox", { name: "自动保存" }) as HTMLInputElement)
        .checked,
    ).toBe(false);

    render(<CheckBox onCheckedChange={controlledChange}>手动保存</CheckBox>);
    fireEvent.click(screen.getByRole("checkbox", { name: "手动保存" }));

    expect(controlledChange).toHaveBeenLastCalledWith(true);
  });

  it("does not change while disabled", () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();

    render(
      <CheckBox disabled onCheckedChange={onCheckedChange}>
        禁用复选框
      </CheckBox>,
    );

    const control = screen.getByRole("checkbox", { name: "禁用复选框" });

    fireEvent.click(control);

    expect((control as HTMLInputElement).disabled).toBe(true);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("supports native form attributes", () => {
    render(
      <CheckBox defaultChecked name="features" required value="beta">
        Beta 功能
      </CheckBox>,
    );

    const control = screen.getByRole("checkbox", {
      name: "Beta 功能",
    }) as HTMLInputElement;

    expect(control.name).toBe("features");
    expect(control.value).toBe("beta");
    expect(control.required).toBe(true);
    expect(control.checked).toBe(true);
  });
});
