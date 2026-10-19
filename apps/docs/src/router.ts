import { useSyncExternalStore } from "react";

export const DEFAULT_ROUTE = "overview";

function normalize(hash: string): string {
  const route = hash.replace(/^#\/?/, "").replace(/\/+$/, "");
  return route.length > 0 ? route : DEFAULT_ROUTE;
}

function readRoute(): string {
  if (typeof window === "undefined") {
    return DEFAULT_ROUTE;
  }

  return normalize(window.location.hash);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/**
 * 基于 location.hash 的路由。
 *
 * 用 hash 而不是 history API，是为了让静态托管（GitHub Pages 子路径）
 * 不需要任何回退规则；刷新、前进后退和直接分享链接都可用。
 */
export function useRoute(): string {
  return useSyncExternalStore(subscribe, readRoute, () => DEFAULT_ROUTE);
}

export function routeHref(route: string): string {
  return route === DEFAULT_ROUTE ? "#/" : `#/${route}`;
}

export function navigate(route: string): void {
  window.location.hash = routeHref(route);
}
