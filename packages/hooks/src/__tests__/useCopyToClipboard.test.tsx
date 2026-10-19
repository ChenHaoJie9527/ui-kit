import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCopyToClipboard } from "../useCopyToClipboard";

function mockClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, "clipboard");
  Reflect.deleteProperty(document, "execCommand");
});

describe("useCopyToClipboard", () => {
  it("copies through the Clipboard API", async () => {
    const writeText = vi.fn<() => Promise<void>>(async () => undefined);
    mockClipboard(writeText);

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await expect(result.current[1]("hello")).resolves.toBe(true);
    });

    expect(writeText).toHaveBeenCalledWith("hello");
    expect(result.current[0]).toEqual({
      value: "hello",
      error: undefined,
      copied: true,
    });
  });

  it("reports clipboard errors", async () => {
    const error = new Error("permission denied");
    mockClipboard(async () => {
      throw error;
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await expect(result.current[1]("hello")).resolves.toBe(false);
    });

    expect(result.current[0].error).toBe(error);
    expect(result.current[0].copied).toBe(false);
    expect(result.current[0].value).toBeUndefined();
  });

  it("falls back to execCommand when the Clipboard API is unavailable", async () => {
    const execCommand = vi.fn<() => boolean>(() => true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommand,
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await expect(result.current[1]("fallback")).resolves.toBe(true);
    });

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(result.current[0].copied).toBe(true);
  });
});
