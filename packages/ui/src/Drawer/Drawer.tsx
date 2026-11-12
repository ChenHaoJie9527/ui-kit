import { DrawerBody } from "./DrawerBody";
import { DrawerClose } from "./DrawerClose";
import { DrawerContent } from "./DrawerContent";
import { DrawerDescription } from "./DrawerDescription";
import { DrawerFooter } from "./DrawerFooter";
import { DrawerHeader } from "./DrawerHeader";
import { DrawerRoot } from "./DrawerRoot";
import { DrawerTitle } from "./DrawerTitle";
import { DrawerTrigger } from "./DrawerTrigger";

export interface DrawerComponent {
  Root: typeof DrawerRoot;
  Trigger: typeof DrawerTrigger;
  Content: typeof DrawerContent;
  Header: typeof DrawerHeader;
  Title: typeof DrawerTitle;
  Description: typeof DrawerDescription;
  Body: typeof DrawerBody;
  Footer: typeof DrawerFooter;
  Close: typeof DrawerClose;
}

/**
 * 边缘抽屉。
 *
 * 原生 dialog 承载模态语义，面板从 side 指定的一侧滑入；焦点进入、Tab 循环、
 * 关闭后恢复焦点与滚动锁定由 hooks 补齐。仅提供组合式 API。
 */
export const Drawer: DrawerComponent = {
  Root: DrawerRoot,
  Trigger: DrawerTrigger,
  Content: DrawerContent,
  Header: DrawerHeader,
  Title: DrawerTitle,
  Description: DrawerDescription,
  Body: DrawerBody,
  Footer: DrawerFooter,
  Close: DrawerClose,
};
