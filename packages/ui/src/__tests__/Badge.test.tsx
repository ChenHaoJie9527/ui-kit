import { act, createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Badge, type BadgeVariant } from "../Badge";

const variants: BadgeVariant[] = [
  "default",
  "primary",
  "success",
  "warning",
  "danger",
  "loading",
];

const iconVariants = variants.filter((variant) => variant !== "loading");

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

  describe("status icon", () => {
    it.each(iconVariants)("renders the default icon for %s", (variant) => {
      render(<Badge variant={variant}>{variant}</Badge>);
      expect(document.querySelector(".uk-badge__icon svg")).toBeTruthy();
    });

    it("hides the icon from assistive technology", () => {
      render(<Badge variant="success">已发布</Badge>);
      expect(
        document.querySelector(".uk-badge__icon")?.getAttribute("aria-hidden"),
      ).toBe("true");
    });

    it("hides the icon with showIcon={false}", () => {
      render(
        <Badge variant="success" showIcon={false}>
          已发布
        </Badge>,
      );
      expect(document.querySelector(".uk-badge__icon")).toBeNull();
    });

    it("renders a custom icon instead of the default one", () => {
      render(
        <Badge variant="primary" icon={<span data-testid="custom-icon" />}>
          文档
        </Badge>,
      );
      expect(screen.getByTestId("custom-icon")).toBeTruthy();
      expect(document.querySelector(".uk-badge__icon svg")).toBeNull();
    });

    it("applies the size attribute", () => {
      render(<Badge size="sm">小号</Badge>);
      expect(
        document.querySelector(".uk-badge")?.getAttribute("data-size"),
      ).toBe("sm");
    });
  });

  describe("loading", () => {
    it("renders a spinner and marks the badge busy", () => {
      render(<Badge variant="loading">同步中</Badge>);
      const badge = document.querySelector(".uk-badge");
      expect(badge?.getAttribute("aria-busy")).toBe("true");
      expect(document.querySelector(".uk-badge__spinner")).toBeTruthy();
    });

    it("does not mark other variants busy", () => {
      render(<Badge variant="success">已完成</Badge>);
      expect(
        document.querySelector(".uk-badge")?.getAttribute("aria-busy"),
      ).toBeNull();
    });

    it("keeps the label readable", () => {
      render(<Badge variant="loading">同步中</Badge>);
      expect(screen.getByText("同步中")).toBeTruthy();
    });

    it("hides the dismiss button while loading", () => {
      render(
        <Badge variant="loading" onDismiss={() => {}} dismissLabel="移除同步中">
          同步中
        </Badge>,
      );
      expect(screen.queryByRole("button")).toBeNull();
    });

    it("pulses by default only for loading", () => {
      const { unmount } = render(<Badge variant="loading">同步中</Badge>);
      expect(document.querySelector(".uk-badge__pulse")).toBeTruthy();
      unmount();

      render(<Badge variant="success">已完成</Badge>);
      expect(document.querySelector(".uk-badge__pulse")).toBeNull();
    });

    it("allows overriding the pulse", () => {
      const { unmount } = render(
        <Badge variant="loading" pulse={false}>
          同步中
        </Badge>,
      );
      expect(document.querySelector(".uk-badge__pulse")).toBeNull();
      unmount();

      render(
        <Badge variant="primary" pulse>
          排队中
        </Badge>,
      );
      expect(document.querySelector(".uk-badge__pulse")).toBeTruthy();
    });

    it("switches the visible label when the status changes", async () => {
      const { rerender } = render(<Badge variant="default">排队中</Badge>);

      await act(async () => {
        rerender(
          <Badge variant="loading" contentKey="syncing">
            同步中
          </Badge>,
        );
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(screen.getByText("同步中")).toBeTruthy();
      expect(document.querySelector(".uk-badge__spinner")).toBeTruthy();
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
