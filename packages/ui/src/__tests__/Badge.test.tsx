import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Badge, type BadgeVariant } from "../Badge";

const variants: BadgeVariant[] = [
  "default",
  "primary",
  "success",
  "warning",
  "danger",
];

describe("Badge", () => {
  describe("rendering", () => {
    it("renders children with default variant", () => {
      render(<Badge>Active</Badge>);
      const badge = screen.getByText("Active").closest(".uk-badge");
      expect(badge?.tagName).toBe("SPAN");
      expect(badge?.getAttribute("data-variant")).toBe("default");
    });

    it.each(variants)("applies %s variant", (variant) => {
      render(<Badge variant={variant}>{variant}</Badge>);
      expect(
        screen
          .getByText(variant)
          .closest(".uk-badge")
          ?.getAttribute("data-variant"),
      ).toBe(variant);
    });

    it("merges className", () => {
      render(<Badge className="custom">Tag</Badge>);
      const badge = screen.getByText("Tag").closest(".uk-badge");
      expect(badge?.classList.contains("custom")).toBe(true);
      expect(badge?.classList.contains("uk-badge")).toBe(true);
    });

    it("forwards ref", () => {
      const ref = createRef<HTMLSpanElement>();
      render(<Badge ref={ref}>Tag</Badge>);
      expect(ref.current?.tagName).toBe("SPAN");
    });
  });

  describe("dismiss", () => {
    it("shows dismiss button when onDismiss is provided", () => {
      render(<Badge onDismiss={() => {}}>Tag</Badge>);
      expect(screen.getByRole("button")).toBeTruthy();
    });

    it("does not show dismiss button without onDismiss", () => {
      render(<Badge>Tag</Badge>);
      expect(screen.queryByRole("button")).toBeNull();
    });

    it("calls onDismiss on click", () => {
      const onDismiss = vi.fn<() => void>();
      render(<Badge onDismiss={onDismiss}>Tag</Badge>);
      fireEvent.click(screen.getByRole("button"));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("uses custom dismissLabel", () => {
      render(
        <Badge onDismiss={() => {}} dismissLabel="Remove filter">
          Tag
        </Badge>,
      );
      expect(
        screen.getByRole("button", { name: "Remove filter" }),
      ).toBeTruthy();
    });

    it("disables dismiss button when dismissDisabled", () => {
      render(
        <Badge onDismiss={() => {}} dismissDisabled>
          Tag
        </Badge>,
      );
      expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(
        true,
      );
    });

    it("does not call onDismiss when disabled", () => {
      const onDismiss = vi.fn<() => void>();
      render(
        <Badge onDismiss={onDismiss} dismissDisabled>
          Tag
        </Badge>,
      );
      fireEvent.click(screen.getByRole("button"));
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("has no interactive role on the badge itself", () => {
      render(<Badge>Tag</Badge>);
      const badge = screen.getByText("Tag").closest(".uk-badge");
      expect(badge?.getAttribute("role")).toBeNull();
      expect(badge?.getAttribute("tabindex")).toBeNull();
    });

    it("dismiss button has accessible name", () => {
      render(<Badge onDismiss={() => {}}>Tag</Badge>);
      const button = screen.getByRole("button");
      expect(button.getAttribute("aria-label")).toBeTruthy();
    });

    it("dismiss icon is aria-hidden", () => {
      render(<Badge onDismiss={() => {}}>Tag</Badge>);
      const svg = document.querySelector(".uk-badge__dismiss-icon");
      expect(svg?.getAttribute("aria-hidden")).toBe("true");
    });
  });
});
