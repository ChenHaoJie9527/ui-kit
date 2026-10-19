import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAsyncRetry } from "../useAsyncRetry";

describe("useAsyncRetry", () => {
  it("runs successfully on the first attempt", async () => {
    const { result } = renderHook(() => useAsyncRetry(async () => "value"));

    await waitFor(() => expect(result.current.value).toBe("value"));
    expect(result.current.error).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });

  it("retries after a failure", async () => {
    let calls = 0;
    const asyncFunction = vi.fn<() => Promise<string>>(async () => {
      calls += 1;

      if (calls === 1) {
        throw new Error("fail once");
      }

      return "recovered";
    });

    const { result } = renderHook(() => useAsyncRetry(asyncFunction));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("fail once");

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.value).toBe("recovered"));
    expect(result.current.error).toBeUndefined();
    expect(asyncFunction).toHaveBeenCalledTimes(2);
  });
});
