import { forwardRef, type ReactElement, type RefAttributes } from "react";

import { markControl } from "../control-contract";
import { SelectPresence } from "./SelectLayer";
import {
  SelectRoot,
  type SelectBaseProps,
  type SelectMultipleProps,
  type SelectSingleProps,
} from "./SelectRoot";
import { SelectTrigger } from "./SelectTrigger";

type SelectInternalProps = SelectBaseProps & {
  multiple?: boolean;
  value?: string | ReadonlyArray<string> | null;
  defaultValue?: string | ReadonlyArray<string> | null;
  onValueChange?: (value: string | Array<string>) => void;
};

const SelectComponent = forwardRef<HTMLDivElement, SelectInternalProps>(
  function Select(
    {
      options,
      multiple,
      value,
      defaultValue,
      onValueChange,
      placeholder,
      size = "md",
      clear,
      disabled,
      invalid,
      emptyText = "暂无可选项",
      loading = false,
      loadingText = "加载中...",
      className,
      ...rest
    },
    ref,
  ) {
    return (
      <SelectRoot
        options={options}
        loading={loading}
        multiple={multiple}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
      >
        <SelectTrigger
          {...rest}
          ref={ref}
          placeholder={placeholder}
          size={size}
          clear={clear}
          loadingText={loadingText}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          data-size={size}
          className={className}
        />
        <SelectPresence emptyText={emptyText} />
      </SelectRoot>
    );
  },
) as {
  (
    props: SelectSingleProps & RefAttributes<HTMLDivElement>,
  ): ReactElement | null;
  (
    props: SelectMultipleProps & RefAttributes<HTMLDivElement>,
  ): ReactElement | null;
};

export const Select = markControl(SelectComponent, "value");
