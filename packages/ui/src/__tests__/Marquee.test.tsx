import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import type { MarqueeItemDetail } from "../Marquee";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Marquee } from "../Marquee";

interface CustomerData {
  id: string;
}

const customerItems = [
  { key: "first", content: <span>客户一</span>, data: { id: "first" } },
  { key: "second", content: <span>客户二</span>, data: { id: "second" } },
];

const interactiveCustomerItems = [
  {
    key: "first",
    content: <button type="button">客户一</button>,
    data: { id: "first" },
  },
  {
    key: "second",
    content: <button type="button">客户二</button>,
    data: { id: "second" },
  },
];

const itemClick =
  vi.fn<(item: MarqueeItemDetail<CustomerData>, event: unknown) => void>();

describe("Marquee", () => {
  beforeEach(() => {
    itemClick.mockClear();
  });

  it("renders one accessible track and one inert duplicate", () => {
    render(
      <Marquee>
        <span>客户一</span>
        <span>客户二</span>
      </Marquee>,
    );

    const tracks = document.querySelectorAll(".uk-marquee__track");
    const primary = screen.getAllByText("客户一")[0];
    const duplicate = document.querySelector(
      '[data-duplicate="true"]',
    ) as HTMLElement;

    expect(tracks).toHaveLength(2);
    expect(primary?.parentElement?.getAttribute("aria-hidden")).toBeNull();
    expect(
      duplicate.closest('[data-duplicate="true"]')?.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(duplicate.hasAttribute("inert")).toBe(true);
  });

  it("applies direction, fade, duration, and gap", () => {
    render(
      <Marquee
        direction="up"
        fade={false}
        gap="0.5rem"
        speed={18}
        data-testid="marquee"
      >
        <span>内容</span>
      </Marquee>,
    );

    const marquee = screen.getByTestId("marquee");

    expect(marquee.getAttribute("data-direction")).toBe("up");
    expect(marquee.hasAttribute("data-fade")).toBe(false);
    expect(marquee.style.getPropertyValue("--uk-marquee-duration")).toBe("18s");
    expect(marquee.style.getPropertyValue("--uk-marquee-gap")).toBe("0.5rem");
  });

  it("keeps hover pausing opt-out aware", () => {
    render(
      <Marquee data-testid="marquee" pauseOnHover={false}>
        <span>内容</span>
      </Marquee>,
    );

    expect(
      screen.getByTestId("marquee").hasAttribute("data-pause-on-hover"),
    ).toBe(false);
  });

  it("keeps exactly two fixed tracks for the reference animation model", () => {
    render(
      <Marquee>
        <span>内容</span>
      </Marquee>,
    );

    const tracks = document.querySelectorAll(".uk-marquee__track");

    expect(tracks).toHaveLength(2);
    expect(tracks[0]?.children).toHaveLength(1);
    expect(tracks[1]?.children).toHaveLength(1);
  });

  it("exposes manual pause state as a controlled animation state", () => {
    const { rerender } = render(
      <Marquee data-testid="marquee">
        <span>内容</span>
      </Marquee>,
    );

    expect(screen.getByTestId("marquee").getAttribute("data-paused")).toBe(
      "false",
    );

    rerender(
      <Marquee data-testid="marquee" paused>
        <span>内容</span>
      </Marquee>,
    );

    expect(screen.getByTestId("marquee").getAttribute("data-paused")).toBe(
      "true",
    );
  });

  it("calls item click handlers with stable item metadata", () => {
    const onItemClick = itemClick;
    render(
      <Marquee items={customerItems} onItemClick={onItemClick}>
        <span>被 items 覆盖</span>
      </Marquee>,
    );

    const first = screen.getByRole("button", { name: "客户一" });
    fireEvent.click(first);

    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledWith(
      { index: 0, key: "first", data: { id: "first" } },
      expect.anything(),
    );
  });

  it("keeps duplicate items hidden from assistive technology but clickable", () => {
    const onItemClick = itemClick;
    render(
      <Marquee items={customerItems} onItemClick={onItemClick}>
        <span>被 items 覆盖</span>
      </Marquee>,
    );

    const duplicate = document.querySelector(
      '[data-duplicate="true"] [data-clickable="true"]',
    ) as HTMLElement;

    const duplicateTrack = document.querySelector(
      '[data-duplicate="true"]',
    ) as HTMLElement;

    expect(duplicateTrack.getAttribute("aria-hidden")).toBe("true");
    expect(duplicate.tabIndex).toBe(-1);
    fireEvent.click(duplicate);

    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledWith(
      { index: 0, key: "first", data: { id: "first" } },
      expect.anything(),
    );
  });

  it("activates clickable items with Enter and Space", () => {
    const onItemClick = itemClick;
    render(
      <Marquee items={customerItems} onItemClick={onItemClick}>
        <span>被 items 覆盖</span>
      </Marquee>,
    );

    const first = screen.getByRole("button", { name: "客户一" });
    fireEvent.keyDown(first, { key: "Enter" });
    fireEvent.keyDown(first, { key: " " });

    expect(onItemClick).toHaveBeenCalledTimes(2);
    expect(onItemClick).toHaveBeenLastCalledWith(
      { index: 0, key: "first", data: { id: "first" } },
      expect.anything(),
    );
  });

  it("does not keep focus inside the duplicate track", () => {
    render(
      <Marquee items={interactiveCustomerItems}>
        <span>被 items 覆盖</span>
      </Marquee>,
    );

    const duplicateButton = document.querySelectorAll(
      '[data-duplicate="true"] button',
    )[0] as HTMLButtonElement;

    fireEvent.focus(duplicateButton);

    expect(document.activeElement).not.toBe(duplicateButton);
  });
});
