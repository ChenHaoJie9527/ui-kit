import type { ReactElement } from "react";

import { ProgressDescription } from "./ProgressDescription";
import { ProgressLabel } from "./ProgressLabel";
import { ProgressRoot, type ProgressProps } from "./ProgressRoot";
import { ProgressValue } from "./ProgressValue";

export interface ProgressComponent {
  (props: ProgressProps): ReactElement;
  Label: typeof ProgressLabel;
  Value: typeof ProgressValue;
  Description: typeof ProgressDescription;
}

/**
 * 复合入口：<Progress> 即根组件，子部件用
 * <Progress.Label> / <Progress.Value> / <Progress.Description> 组合。
 * 平铺导出的 ProgressLabel / ProgressValue / ProgressDescription 是等价别名。
 */
export const Progress: ProgressComponent = Object.assign(ProgressRoot, {
  Label: ProgressLabel,
  Value: ProgressValue,
  Description: ProgressDescription,
});
export { ProgressDescription, ProgressLabel, ProgressValue };
export type { ProgressProps } from "./ProgressRoot";
