import type { ReactElement } from "react";

import { SidebarGroup } from "./SidebarGroup";
import { SidebarItem } from "./SidebarItem";
import { SidebarRoot, type SidebarProps } from "./SidebarRoot";

export interface SidebarComponent {
  (props: SidebarProps): ReactElement;
  Group: typeof SidebarGroup;
  Item: typeof SidebarItem;
}

export const Sidebar: SidebarComponent = Object.assign(SidebarRoot, {
  Group: SidebarGroup,
  Item: SidebarItem,
});
