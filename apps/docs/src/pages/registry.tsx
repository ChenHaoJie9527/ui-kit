import type { ComponentType, ReactNode } from "react";
import { hookDocs } from "../content/hooks";
import { ButtonPage } from "./button";
import { CustomizingPage } from "./customizing";
import { DialogPage } from "./dialog";
import { HookPage } from "./hook";
import { InputPage } from "./input";
import { OverviewPage } from "./overview";
import { SwitchPage } from "./switch";
import { TabsPage } from "./tabs";
import { ToastPage } from "./toast";

const componentPages: Record<string, ComponentType> = {
  "components/button": ButtonPage,
  "components/input": InputPage,
  "components/switch": SwitchPage,
  "components/tabs": TabsPage,
  "components/dialog": DialogPage,
  "components/toast": ToastPage,
};

export const routeRenderers: Record<string, () => ReactNode> = {
  overview: () => <OverviewPage />,
  customizing: () => <CustomizingPage />,
};

for (const [path, PageComponent] of Object.entries(componentPages)) {
  routeRenderers[path] = () => <PageComponent />;
}

for (const doc of hookDocs) {
  routeRenderers[doc.path] = () => <HookPage doc={doc} />;
}
