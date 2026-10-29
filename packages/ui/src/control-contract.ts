export const CONTROL_KIND = "__seamControlKind" as const;

export type ControlKind = "boolean" | "value";

export function markControl<T extends object>(
  component: T,
  kind: ControlKind,
): T {
  Object.defineProperty(component, CONTROL_KIND, {
    configurable: true,
    value: kind,
  });
  return component;
}

export function getControlKind(component: unknown): ControlKind | undefined {
  if (
    component === null ||
    (typeof component !== "object" && typeof component !== "function")
  ) {
    return undefined;
  }

  const kind = (component as Record<string, unknown>)[CONTROL_KIND];
  return kind === "boolean" || kind === "value" ? kind : undefined;
}
