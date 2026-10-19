import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Input } from "../Input";

describe("Input", () => {
  it("renders with the default size and forwards refs", () => {
    const ref = createRef<HTMLInputElement>();

    render(<Input ref={ref} aria-label="名称" placeholder="ui-kit" />);

    const input = screen.getByRole("textbox", { name: "名称" });

    expect(input.dataset.size).toBe("md");
    expect(input.getAttribute("placeholder")).toBe("ui-kit");
    expect(ref.current).toBe(input);
  });

  it("maps invalid to aria-invalid", () => {
    render(<Input aria-label="邮箱" invalid />);

    expect(
      screen
        .getByRole("textbox", { name: "邮箱" })
        .getAttribute("aria-invalid"),
    ).toBe("true");
  });

  it("keeps an explicit aria-invalid when invalid is not set", () => {
    render(<Input aria-label="邮箱" aria-invalid="grammar" />);

    expect(
      screen
        .getByRole("textbox", { name: "邮箱" })
        .getAttribute("aria-invalid"),
    ).toBe("grammar");
  });

  it("supports custom sizes and class names", () => {
    render(<Input aria-label="搜索" inputSize="lg" className="custom" />);

    const input = screen.getByRole("textbox", { name: "搜索" });

    expect(input.dataset.size).toBe("lg");
    expect(input.classList.contains("custom")).toBe(true);
  });
});
