import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../Button";

describe("Button", () => {
  it("exposes variant and size through data attributes", () => {
    render(
      <Button variant="danger" size="lg">
        删除
      </Button>,
    );

    const button = screen.getByRole("button", {
      name: "删除",
    }) as HTMLButtonElement;

    expect(button.dataset.variant).toBe("danger");
    expect(button.dataset.size).toBe("lg");
    expect(button.type).toBe("button");
  });

  it("forwards native props and the ref", () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn<() => void>();

    render(
      <Button ref={ref} className="custom" onClick={onClick} type="submit">
        提交
      </Button>,
    );

    const button = screen.getByRole("button", {
      name: "提交",
    }) as HTMLButtonElement;

    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button.type).toBe("submit");
    expect(button.classList.contains("custom")).toBe(true);
    expect(ref.current).toBe(button);
  });

  it("disables itself and reports aria-busy while loading", () => {
    const onClick = vi.fn<() => void>();

    render(
      <Button loading onClick={onClick}>
        保存
      </Button>,
    );

    const button = screen.getByRole("button", { name: "保存" });

    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.dataset.loading).toBe("true");

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("supports square icon-only rendering", () => {
    render(
      <Button iconOnly aria-label="关闭">
        ×
      </Button>,
    );

    const button = screen.getByRole("button", { name: "关闭" });

    expect(button.dataset.iconOnly).toBe("true");
  });
});
