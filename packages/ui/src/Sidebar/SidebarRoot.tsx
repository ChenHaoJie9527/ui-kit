import {
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

import { LayoutGroup } from "motion/react";

import { cx } from "../utils/cx";
import { SidebarContext, type SidebarContextValue } from "./sidebar-context";

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  /**
   * 鼠标悬停时是否显示会跟随指针移动的背景预览。
   *
   * @default true
   */
  hoverPreview?: boolean;
  /**
   * 鼠标预览的互斥呈现方式：轨道游标或整行背景。
   *
   * @default "rail"
   */
  hoverIndicator?: SidebarHoverIndicator;
  /**
   * 分组之间的垂直间距。数字按 px 处理，也可传入 CSS 长度字符串。
   *
   * @default "1.5rem"
   */
  groupGap?: number | string;
}

export type SidebarHoverIndicator = "rail" | "background";

export function SidebarRoot({
  children,
  className,
  hoverPreview = true,
  hoverIndicator = "rail",
  groupGap,
  style,
  ...rest
}: SidebarProps): ReactElement {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const indicatorBaseId = useId().replace(/:/g, "");
  const context = useMemo<SidebarContextValue>(
    () => ({
      hoveredId,
      setHoveredId,
      indicatorBaseId,
      hoverPreview,
      hoverIndicator,
    }),
    [hoveredId, indicatorBaseId, hoverPreview, hoverIndicator],
  );
  const groupGapValue =
    typeof groupGap === "number" ? `${groupGap}px` : groupGap;
  const rootStyle = {
    ...style,
    ...(groupGapValue === undefined
      ? {}
      : { "--uk-sidebar-group-gap": groupGapValue }),
  } as CSSProperties;

  return (
    <SidebarContext.Provider value={context}>
      <LayoutGroup id={`sidebar-${indicatorBaseId}`}>
        <nav
          {...rest}
          className={cx("uk-sidebar", className)}
          style={rootStyle}
        >
          {children}
        </nav>
      </LayoutGroup>
    </SidebarContext.Provider>
  );
}
