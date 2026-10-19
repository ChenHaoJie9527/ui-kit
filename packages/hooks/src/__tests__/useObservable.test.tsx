import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  useObservable,
  type Observer,
  type Subscription,
} from "../useObservable";

class Subject<T> {
  private observers = new Set<Observer<T>>();

  subscribe(observer: Observer<T>): Subscription {
    this.observers.add(observer);

    return {
      unsubscribe: () => {
        this.observers.delete(observer);
      },
    };
  }

  next(value: T) {
    this.observers.forEach((observer) => observer.next(value));
  }

  get size() {
    return this.observers.size;
  }
}

describe("useObservable", () => {
  it("tracks the latest emitted value", () => {
    const subject = new Subject<number>();
    const { result } = renderHook(() => useObservable(subject, 0));

    expect(result.current).toBe(0);

    act(() => {
      subject.next(1);
    });
    expect(result.current).toBe(1);

    act(() => {
      subject.next(2);
    });
    expect(result.current).toBe(2);
  });

  it("unsubscribes on unmount", () => {
    const subject = new Subject<number>();
    const { unmount } = renderHook(() => useObservable(subject));

    expect(subject.size).toBe(1);
    unmount();
    expect(subject.size).toBe(0);
  });

  it("resubscribes when the observable changes", () => {
    const first = new Subject<string>();
    const second = new Subject<string>();
    const { rerender } = renderHook(
      ({ observable }: { observable: Subject<string> }) =>
        useObservable(observable, "initial"),
      { initialProps: { observable: first } },
    );

    expect(first.size).toBe(1);

    rerender({ observable: second });

    expect(first.size).toBe(0);
    expect(second.size).toBe(1);
  });
});
