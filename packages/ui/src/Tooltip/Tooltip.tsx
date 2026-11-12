import { TooltipContent } from "./TooltipContent";
import { TooltipGroup } from "./TooltipGroup";
import { TooltipItem } from "./TooltipItem";
import { TooltipRoot } from "./TooltipRoot";
import { TooltipTrigger } from "./TooltipTrigger";

export interface TooltipComponent {
  Root: typeof TooltipRoot;
  Trigger: typeof TooltipTrigger;
  Content: typeof TooltipContent;
  Group: typeof TooltipGroup;
  Item: typeof TooltipItem;
}

/**
 * 简短说明性浮层。
 *
 * 组合式 API：单个 Tooltip 使用 Root / Trigger / Content；相邻说明使用
 * Group / Item 共享同一个浮动表面。触发器保留原生语义，Content 只承担
 * role="tooltip"；需要交互或较长内容时应使用可见说明或 Popover。
 */
export const Tooltip: TooltipComponent = {
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
  Group: TooltipGroup,
  Item: TooltipItem,
};
