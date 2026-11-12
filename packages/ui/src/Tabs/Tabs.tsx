import type { ReactElement } from "react";

import { TabsContent } from "./TabsContent";
import { TabsList } from "./TabsList";
import { TabsRoot, type TabsProps } from "./TabsRoot";
import { TabsTrigger } from "./TabsTrigger";

export interface TabsComponent {
  (props: TabsProps): ReactElement;
  List: typeof TabsList;
  Trigger: typeof TabsTrigger;
  Content: typeof TabsContent;
}

export const Tabs: TabsComponent = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});
