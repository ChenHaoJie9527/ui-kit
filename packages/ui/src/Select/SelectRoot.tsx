import {
  useCallback,
  useId,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { useControllableState, useEventCallback } from "seam-hooks";

import { SelectContext, type SelectContextValue } from "./select-context";
import { flattenSelectOptions, normalizeSelectValues } from "./select-utils";

export type SelectSize = "sm" | "md" | "lg";

export interface SelectOption {
  /** 提交给 onValueChange 的稳定值。 */
  value: string;
  /** 展示内容；缺省时渲染 value。 */
  label?: ReactNode;
  /** 是否禁止选择该项。 */
  disabled?: boolean;
  /** 子选项；提供 children 的节点只作为分组节点，不提交 value。 */
  children?: Array<SelectOption>;
}

export interface SelectBaseProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "children" | "value" | "onChange" | "aria-expanded" | "defaultValue"
> {
  /** 可选项；label 用于展示，value 用于提交。 */
  options: Array<SelectOption>;
  /** 未选择时的展示文本。 */
  placeholder?: string;
  /** 控件尺寸。 */
  size?: SelectSize;
  /** 是否禁用整个控件。 */
  disabled?: boolean;
  /** 列表为空时的提示文本。 */
  emptyText?: string;
  /** 标记选择值无效，使用共享 invalid 样式。 */
  invalid?: boolean;
  /** 标记选项数据正在加载；请求由调用方管理。 */
  loading?: boolean;
  /** loading 时的提示文本。 */
  loadingText?: string;
  /** 是否显示一键清空按钮。 */
  clear?: boolean;
}

export interface SelectSingleProps extends SelectBaseProps {
  multiple?: false;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
}

export interface SelectMultipleProps extends SelectBaseProps {
  multiple: true;
  value?: ReadonlyArray<string>;
  defaultValue?: ReadonlyArray<string>;
  onValueChange?: (value: Array<string>) => void;
}

export type SelectProps<Multiple extends boolean = false> = SelectBaseProps &
  (Multiple extends true
    ? {
        multiple: true;
        value?: ReadonlyArray<string>;
        defaultValue?: ReadonlyArray<string>;
        onValueChange?: (value: Array<string>) => void;
      }
    : {
        multiple?: false;
        value?: string | null;
        defaultValue?: string | null;
        onValueChange?: (value: string) => void;
      });

export function SelectRoot({
  options,
  loading = false,
  value,
  defaultValue = null,
  onValueChange,
  multiple = false,
  children,
}: {
  options: Array<SelectOption>;
  loading?: boolean;
  value?: string | ReadonlyArray<string> | null;
  defaultValue?: string | ReadonlyArray<string> | null;
  onValueChange?: (value: string | Array<string>) => void;
  multiple?: boolean;
  children: ReactNode;
}): ReactElement {
  const baseId = useId();
  const normalizedValue = normalizeSelectValues(value, multiple);
  const normalizedDefaultValue = normalizeSelectValues(defaultValue, multiple);
  const [values, setSelectedValues] = useControllableState<Array<string>>({
    value: value === undefined ? undefined : normalizedValue,
    defaultValue: normalizedDefaultValue,
    onChange: (next) => {
      onValueChange?.(multiple ? next : (next[0] ?? ""));
    },
  });
  const [open, setOpen] = useState(false);
  const [previousLoading, setPreviousLoading] = useState(loading);

  if (previousLoading !== loading) {
    setPreviousLoading(loading);

    if (loading) {
      setOpen(false);
    }
  }
  const optionNodes = useMemo(() => flattenSelectOptions(options), [options]);
  const selectedNodeIndex = optionNodes.findIndex(
    (node) => node.option.value === values[0],
  );
  const [activeIndexOverride, setActiveIndexOverride] = useState<number | null>(
    null,
  );
  const activeIndex = activeIndexOverride ?? Math.max(selectedNodeIndex, 0);
  const setActiveIndex = useCallback((index: number) => {
    setActiveIndexOverride(index);
  }, []);

  const commit = useEventCallback((index: number) => {
    const node = optionNodes[index];
    const option = node?.option;

    if (loading || !option || option.disabled || node?.hasChildren) {
      return;
    }

    setSelectedValues((previous) => {
      if (multiple) {
        return previous.includes(option.value)
          ? previous.filter((selectedValue) => selectedValue !== option.value)
          : [...previous, option.value];
      }

      if (previous[0] === option.value) {
        return previous;
      }

      return [option.value];
    });

    if (!multiple) {
      setOpen(false);
      setActiveIndexOverride(null);
    }
  });

  const removeValue = useEventCallback((removedValue: string) => {
    setSelectedValues((previous) =>
      previous.filter((selectedValue) => selectedValue !== removedValue),
    );
  });

  const clearValues = useEventCallback(() => {
    setSelectedValues([]);
  });

  const context = useMemo<SelectContextValue>(
    () => ({
      values,
      multiple,
      activeIndex,
      open,
      setOpen,
      setActiveIndex,
      commit,
      removeValue,
      clearValues,
      triggerId: `${baseId}-trigger`,
      contentId: `${baseId}-content`,
      options,
      optionNodes,
      loading,
    }),
    [
      activeIndex,
      baseId,
      commit,
      multiple,
      open,
      options,
      optionNodes,
      loading,
      removeValue,
      clearValues,
      setActiveIndex,
      values,
    ],
  );

  return (
    <SelectContext.Provider value={context}>{children}</SelectContext.Provider>
  );
}
