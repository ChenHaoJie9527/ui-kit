import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAsync } from "../useAsync";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

describe("useAsync", () => {
  it("tracks loading and the resolved value", async () => {
    const pending = deferred<string>();
    const { result } = renderHook(() => useAsync(() => pending.promise));

    expect(result.current.loading).toBe(true);
    expect(result.current.value).toBeUndefined();

    await act(async () => {
      pending.resolve("done");
      await pending.promise;
    });

    expect(result.current).toEqual({
      value: "done",
      error: undefined,
      loading: false,
    });
  });

  it("stores errors", async () => {
    const pending = deferred<string>();
    const error = new Error("request failed");
    const { result } = renderHook(() => useAsync(() => pending.promise));

    await act(async () => {
      pending.reject(error);
      await pending.promise.catch(() => undefined);
    });

    expect(result.current.error).toBe(error);
    expect(result.current.loading).toBe(false);
    expect(result.current.value).toBeUndefined();
  });

  it("ignores stale results after dependencies change", async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const { result, rerender } = renderHook(
      ({ id }: { id: number }) =>
        useAsync(() => (id === 1 ? first.promise : second.promise), [id]),
      { initialProps: { id: 1 } },
    );

    rerender({ id: 2 });

    await act(async () => {
      second.resolve("second");
      await second.promise;
    });
    expect(result.current.value).toBe("second");

    await act(async () => {
      first.resolve("first");
      await first.promise;
    });
    expect(result.current.value).toBe("second");
  });

  it("skips execution when disabled", async () => {
    const asyncFunction = vi.fn<() => Promise<string>>(async () => "value");
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useAsync(asyncFunction, [enabled], { enabled }),
      { initialProps: { enabled: false } },
    );

    expect(asyncFunction).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);

    rerender({ enabled: true });

    await waitFor(() => expect(result.current.value).toBe("value"));
    expect(asyncFunction).toHaveBeenCalledTimes(1);
  });

  it("uses initialValue until the first result arrives", async () => {
    const pending = deferred<string>();
    const { result } = renderHook(() =>
      useAsync(() => pending.promise, [], { initialValue: "initial" }),
    );

    expect(result.current.value).toBe("initial");
    expect(result.current.loading).toBe(true);
  });
});
