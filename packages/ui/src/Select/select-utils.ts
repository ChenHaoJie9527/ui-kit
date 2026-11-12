import type { CSSProperties } from "react";

import type { SelectOptionNode } from "./select-context";
import type { SelectOption } from "./SelectRoot";

export const subscribeToNothing = () => () => {};
export const getClientSnapshot = () => true;
export const getServerSnapshot = () => false;

export function composeHandler<T extends { defaultPrevented: boolean }>(
  childHandler: ((event: T) => void) | undefined,
  handler: (event: T) => void,
) {
  return (event: T) => {
    childHandler?.(event);

    if (!event.defaultPrevented) {
      handler(event);
    }
  };
}

export interface SelectPosition {
  x: number;
  y: number;
  side: "top" | "bottom";
}

export interface SelectSubmenu {
  session: number;
  level: number;
  parentIndex: number;
  left: number;
  top: number;
}

export function clamp(value: number, min: number, max: number) {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

export function normalizeSelectValues(
  value: string | ReadonlyArray<string> | null | undefined,
  multiple: boolean,
) {
  const rawValues = multiple ? (value ?? []) : value == null ? [] : [value];

  return Array.from(new Set(rawValues as ReadonlyArray<string>));
}

export function transformOrigin(
  side: SelectPosition["side"],
): CSSProperties["transformOrigin"] {
  return side === "bottom" ? "center top" : "center bottom";
}

export function flattenSelectOptions(
  options: Array<SelectOption>,
  parentIndex: number | null = null,
  depth = 0,
): Array<SelectOptionNode> {
  let index = 0;

  function flatten(
    currentOptions: Array<SelectOption>,
    currentParentIndex: number | null,
    currentDepth: number,
  ): Array<SelectOptionNode> {
    return currentOptions.flatMap((option) => {
      const children = option.children ?? [];
      const node: SelectOptionNode = {
        option,
        index,
        parentIndex: currentParentIndex,
        depth: currentDepth,
        hasChildren: children.length > 0,
      };

      index += 1;

      return [node, ...flatten(children, node.index, currentDepth + 1)];
    });
  }

  return flatten(options, parentIndex, depth);
}

export function findSelectOption(
  options: Array<SelectOption>,
  value: string,
): SelectOption | null {
  for (const option of options) {
    if (option.value === value) {
      return option;
    }

    const child = findSelectOption(option.children ?? [], value);

    if (child) {
      return child;
    }
  }

  return null;
}

export function hasSelectedDescendant(
  option: SelectOption,
  values: Array<string>,
): boolean {
  return (option.children ?? []).some(
    (child) =>
      values.includes(child.value) || hasSelectedDescendant(child, values),
  );
}

export function moveActiveIndex(
  optionNodes: Array<SelectOptionNode>,
  activeIndex: number,
  direction: 1 | -1,
  wrap = true,
) {
  const total = optionNodes.length;

  if (total === 0) {
    return -1;
  }

  for (let step = 1; step <= total; step += 1) {
    const candidate = wrap
      ? (activeIndex + direction * step + total * step) % total
      : activeIndex + direction * step;

    if (candidate < 0 || candidate >= total) {
      break;
    }

    if (!optionNodes[candidate]?.option.disabled) {
      return candidate;
    }
  }

  return activeIndex;
}

export function firstChildNodeIndex(
  optionNodes: Array<SelectOptionNode>,
  parentIndex: number,
) {
  const parentNode = optionNodes[parentIndex];

  if (!parentNode?.hasChildren) {
    return parentIndex;
  }

  for (
    let index = parentIndex + 1;
    index < optionNodes.length &&
    (optionNodes[index]?.depth ?? 0) > parentNode.depth;
    index += 1
  ) {
    if (
      optionNodes[index]?.depth === parentNode.depth + 1 &&
      !optionNodes[index]?.option.disabled
    ) {
      return index;
    }
  }

  return parentIndex;
}
