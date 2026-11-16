import { createContext, useContext } from "react";

export interface ProgressContextValue {
  /** 原始 value（可能超出 min/max 范围，显示时会夹紧）。 */
  value: number | null;
  min: number;
  max: number;
  /** 夹紧到 0–100 的百分比；value 为 null 时表示不确定进度。 */
  normalized: number | null;
  /** ProgressLabel 注册的 id，用于 root 的 aria-labelledby。 */
  labelId: string | null;
  setLabelId: (id: string | null) => void;
}

export const ProgressContext = createContext<ProgressContextValue | null>(null);

export function useProgressContext(component: string): ProgressContextValue {
  const context = useContext(ProgressContext);

  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Progress>`);
  }

  return context;
}
