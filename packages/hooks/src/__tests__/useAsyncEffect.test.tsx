import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAsyncEffect } from "../useAsyncEffect";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

describe("useAsyncEffect", () => {
  it("tracks loading, success, and errors", async () => {
    const pending = deferred<string>();
    const { result } = renderHook(() => useAsyncEffect(() => pending.promise));

    expect(result.current.status).toBe("loading");
    expect(result.current.loading).toBe(true);
    expect(result.current.value).toBeUndefined();

    await act(async () => {
      pending.resolve("done");
      await pending.promise;
    });

    expect(result.current.status).toBe("success");
    expect(result.current.value).toBe("done");
    expect(result.current.error).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });

  it("normalizes thrown non-Error values", async () => {
    const { result } = renderHook(() =>
      useAsyncEffect(() => Promise.reject("request failed")),
    );

    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("request failed");
  });

  it("preserves initialValue and keeps it after success", async () => {
    const pending = deferred<string>();
    const { result } = renderHook(() =>
      useAsyncEffect(() => pending.promise, [], { initialValue: "initial" }),
    );

    expect(result.current.value).toBe("initial");

    await act(async () => {
      pending.resolve("done");
      await pending.promise;
    });

    expect(result.current.value).toBe("done");
  });

  it("calls only the latest successful cleanup with its result", async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const cleanups = [
      vi.fn<(value: string) => void>(),
      vi.fn<(value: string) => void>(),
    ];
    let callCount = 0;

    const { result, rerender } = renderHook(
      ({ id }: { id: number }) =>
        useAsyncEffect(() => {
          callCount += 1;
          return (callCount === 1 ? first.promise : second.promise).then(
            (value) => () => cleanups[callCount - 1]?.(value),
          );
        }, [id]),
      { initialProps: { id: 1 } },
    );

    rerender({ id: 2 });

    await act(async () => {
      second.resolve("second");
      await second.promise;
    });
    expect(result.current.status).toBe("success");

    rerender({ id: 3 });

    await act(async () => {
      first.resolve("first");
      await first.promise;
    });

    expect(cleanups[0]).not.toHaveBeenCalled();
    expect(cleanups[1]).toHaveBeenCalledWith("second");
  });

  it("runs cleanup with the value returned by an outcome object", async () => {
    const cleanup = vi.fn<(value: string) => void>();
    const { result, unmount } = renderHook(() =>
      useAsyncEffect(() => Promise.resolve({ value: "connected", cleanup })),
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.value).toBe("connected");

    act(() => {
      unmount();
    });
    expect(cleanup).toHaveBeenCalledWith("connected");
  });

  it("cancels the active run and ignores stale results", async () => {
    const pending = deferred<string>();
    const { result } = renderHook(() => useAsyncEffect(() => pending.promise));

    act(() => {
      result.current.cancel();
    });

    expect(result.current.status).toBe("idle");

    await act(async () => {
      pending.resolve("late");
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.value).toBeUndefined();
  });

  it("invalidates the active run when disabled", async () => {
    const pending = deferred<string>();
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useAsyncEffect(() => pending.promise, [enabled], { enabled }),
      { initialProps: { enabled: true } },
    );

    expect(result.current.loading).toBe(true);

    rerender({ enabled: false });

    expect(result.current.status).toBe("idle");
    expect(result.current.loading).toBe(false);

    await act(async () => {
      pending.resolve("late");
      await pending.promise;
    });

    expect(result.current.value).toBeUndefined();
    expect(result.current.status).toBe("idle");
  });
});
