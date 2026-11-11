import { describe, expect, it } from "vitest";
import {
  getCarouselBaseSize,
  getCarouselCenterOffset,
  getCarouselScaleAt,
  getCarouselScaleGeometry,
  resolveCarouselScale,
  resolveCarouselVisible,
} from "../carousel-geometry";

describe("carousel-geometry", () => {
  it("normalizes scale and visible inputs", () => {
    expect(resolveCarouselScale(undefined)).toBeUndefined();
    expect(resolveCarouselScale(1)).toBeUndefined();
    expect(resolveCarouselScale(0.8)).toBe(0.8);
    expect(resolveCarouselScale(0)).toBe(0.1);
    expect(resolveCarouselScale(2)).toBeUndefined();

    expect(resolveCarouselVisible(0)).toBe(1);
    expect(resolveCarouselVisible(2.4)).toBe(2);
    expect(resolveCarouselVisible(Number.NaN)).toBe(1);
  });

  it("scales the center and its neighbours", () => {
    expect(getCarouselScaleAt(0, 0.8, 1)).toBe(1);
    expect(getCarouselScaleAt(1, 0.8, 1)).toBeCloseTo(0.8);
    expect(getCarouselScaleAt(-1, 0.8, 1)).toBeCloseTo(0.8);
    expect(getCarouselScaleAt(2, 0.8, 1)).toBeCloseTo(0.68);
    expect(getCarouselScaleAt(1.5, 0.8, 1)).toBeCloseTo(0.74);
  });

  it("keeps the centre at zero and mirrors offsets", () => {
    expect(getCarouselCenterOffset(0, 300, 16, 0.8, 1)).toBe(0);
    expect(getCarouselCenterOffset(1, 300, 16, 0.8, 1)).toBeCloseTo(
      150 + 16 + 120,
    );
    expect(getCarouselCenterOffset(-1, 300, 16, 0.8, 1)).toBeCloseTo(
      -(150 + 16 + 120),
    );
  });

  it("sizes an odd visible row with gaps", () => {
    const base = getCarouselBaseSize({
      length: 900,
      gap: 0,
      visible: 3,
      scale: 0.8,
    });

    expect(base).toBeCloseTo(900 / 2.6);

    const withGap = getCarouselBaseSize({
      length: 900,
      gap: 16,
      visible: 3,
      scale: 0.8,
    });

    expect(withGap).toBeCloseTo((900 - 32) / 2.6);
  });

  it("sizes an even visible row with half edge slides", () => {
    const base = getCarouselBaseSize({
      length: 900,
      gap: 16,
      visible: 4,
      scale: 0.8,
    });

    expect(base).toBeCloseTo((900 - 64) / (1 + 2 * 0.8 + 0.8 ** 2));
  });

  it("returns a normalized geometry object", () => {
    const geometry = getCarouselScaleGeometry({
      length: 900,
      gap: 0,
      visible: 3.4,
      scale: 0.8,
    });

    expect(geometry.resolvedVisible).toBe(3);
    expect(geometry.side).toBe(1);
    expect(geometry.base).toBeCloseTo(900 / 2.6);
  });

  it("handles zero-length and single-visible inputs without NaN", () => {
    expect(
      getCarouselBaseSize({
        length: 0,
        gap: 0,
        visible: 3,
        scale: 0.8,
      }),
    ).toBe(0);
    expect(
      getCarouselBaseSize({
        length: 900,
        gap: 0,
        visible: 1,
        scale: 0.8,
      }),
    ).toBe(900);
  });
});
