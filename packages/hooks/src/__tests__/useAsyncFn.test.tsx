import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAsyncFn } from "../useAsyncFn";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

describe("useAsyncFn", () => {
  it("tracks loading and the resolved value", async () => {
    const pending = deferred<number>();
    const { result } = renderHook(() =>
      useAsyncFn((_a: number, _b: number) => pending.promise),
    );

    let promise!: Promise<number>;
    act(() => {
      promise = result.current[1](1, 2);
    });

    expect(result.current[0].loading).toBe(true);

    await act(async () => {
      pending.resolve(3);
      await promise;
    });

    expect(result.current[0]).toEqual({
      value: 3,
      error: undefined,
      loading: false,
    });
  });

  it("stores errors and rethrows them", async () => {
    const pending = deferred<number>();
    const error = new Error("boom");
    const { result } = renderHook(() => useAsyncFn(() => pending.promise));

    let promise!: Promise<number>;
    act(() => {
      promise = result.current[1]();
    });

    await act(async () => {
      pending.reject(error);
      await expect(promise).rejects.toBe(error);
    });

    expect(result.current[0].error).toBe(error);
    expect(result.current[0].loading).toBe(false);
  });

  it("keeps the result of the latest call", async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    let callCount = 0;

    const { result } = renderHook(() =>
      useAsyncFn(() => {
        callCount += 1;
        return callCount === 1 ? first.promise : second.promise;
      }),
    );

    act(() => {
      void result.current[1]();
      void result.current[1]();
    });

    await act(async () => {
      second.resolve("second");
      await second.promise;
    });
    expect(result.current[0].value).toBe("second");

    await act(async () => {
      first.resolve("first");
      await first.promise;
    });
    expect(result.current[0].value).toBe("second");
  });
});
