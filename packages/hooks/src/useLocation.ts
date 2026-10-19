import { useMemo, useSyncExternalStore } from "react";

export interface LocationState {
  href: string;
  origin: string;
  pathname: string;
  search: string;
  hash: string;
}

const LOCATION_CHANGE_EVENT = "ui-kit:locationchange";

let listenerCount = 0;
let originalPushState: History["pushState"] | null = null;
let originalReplaceState: History["replaceState"] | null = null;

function notifyLocationChange() {
  window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
}

function patchHistory() {
  if (typeof window === "undefined" || originalPushState) {
    return;
  }

  originalPushState = window.history.pushState;
  originalReplaceState = window.history.replaceState;

  window.history.pushState = function pushState(...args) {
    originalPushState?.apply(window.history, args);
    notifyLocationChange();
  };
  window.history.replaceState = function replaceState(...args) {
    originalReplaceState?.apply(window.history, args);
    notifyLocationChange();
  };
}

function restoreHistory() {
  if (typeof window === "undefined") {
    return;
  }

  if (originalPushState) {
    window.history.pushState = originalPushState;
  }
  if (originalReplaceState) {
    window.history.replaceState = originalReplaceState;
  }

  originalPushState = null;
  originalReplaceState = null;
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  listenerCount += 1;
  patchHistory();

  window.addEventListener("popstate", onStoreChange);
  window.addEventListener("hashchange", onStoreChange);
  window.addEventListener(LOCATION_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("popstate", onStoreChange);
    window.removeEventListener("hashchange", onStoreChange);
    window.removeEventListener(LOCATION_CHANGE_EVENT, onStoreChange);

    listenerCount -= 1;

    if (listenerCount === 0) {
      restoreHistory();
    }
  };
}

function getSnapshot(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.href;
}

const emptyLocation: LocationState = {
  href: "",
  origin: "",
  pathname: "",
  search: "",
  hash: "",
};

/**
 * 跟踪页面当前地址。
 *
 * 同时监听 popstate、hashchange 以及 pushState / replaceState，
 * 因此单页应用里的编程式导航也能被感知。返回值在地址不变时保持引用稳定。
 */
export function useLocation(): LocationState {
  const href = useSyncExternalStore(subscribe, getSnapshot, () => "");

  return useMemo(() => {
    if (!href) {
      return emptyLocation;
    }

    const url = new URL(href);

    return {
      href,
      origin: url.origin,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
    };
  }, [href]);
}
