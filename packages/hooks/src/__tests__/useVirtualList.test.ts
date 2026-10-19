import { describe, expect, it } from "vitest";
import { useVirtualList } from "../useVirtualList";

describe("useVirtualList", () => {
  const base = { count: 10000, itemHeight: 40, viewportHeight: 400 };

  it("renders only the visible window plus overscan", () => {
    const range = useVirtualList({ ...base, scrollTop: 0 });

    expect(range.start).toBe(0);
    expect(range.end).toBe(10 + 8);
    expect(range.totalHeight).toBe(400000);
    expect(range.offsetTop).toBe(0);
  });

  it("moves the window with scroll position", () => {
    const range = useVirtualList({ ...base, scrollTop: 2000 });

    expect(range.start).toBe(50 - 4);
    expect(range.offsetTop).toBe(46 * 40);
  });

  it("clamps at the end of the list", () => {
    const range = useVirtualList({ ...base, scrollTop: 400000 });

    expect(range.start).toBeLessThanOrEqual(9999);
    expect(range.end).toBe(10000);
    expect(range.totalHeight).toBe(400000);
  });

  it("handles an empty list", () => {
    const range = useVirtualList({
      count: 0,
      itemHeight: 40,
      viewportHeight: 400,
      scrollTop: 0,
    });

    expect(range.start).toBe(0);
    expect(range.end).toBe(0);
    expect(range.totalHeight).toBe(0);
  });
});
