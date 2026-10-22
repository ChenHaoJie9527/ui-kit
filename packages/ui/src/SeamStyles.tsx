import type { ReactElement } from "react";
import { UI_CSS } from "./styles.generated";

export interface SeamStylesProps {
  /** 与 Content Security Policy 的 style-src nonce 保持一致。 */
  nonce?: string;
}

/**
 * 将完整样式以内联 style 标签提供。
 *
 * 在应用根部渲染一次即可，也可以继续导入构建产物中的 styles.css。
 */
export function SeamStyles({ nonce }: SeamStylesProps): ReactElement {
  return (
    <style data-seam-ui="" nonce={nonce}>
      {UI_CSS}
    </style>
  );
}
