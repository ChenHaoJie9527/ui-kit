import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Marquee } from "../Marquee";

describe("Marquee", () => {
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
    expect(duplicate.getAttribute("aria-hidden")).toBe("true");
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
});
