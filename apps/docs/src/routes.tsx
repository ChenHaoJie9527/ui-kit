import type { ComponentType } from "react";
import { createHashRouter, useParams } from "react-router";
import { hookByPath } from "./content/hooks";
import { AppLayout } from "./App";
import { ButtonPage } from "./pages/button";
import { CheckBoxPage } from "./pages/checkbox";
import { CustomizingPage } from "./pages/customizing";
import { DialogPage } from "./pages/dialog";
import { HookPage } from "./pages/hook";
import { InputPage } from "./pages/input";
import { MarqueePage } from "./pages/marquee";
import { NotFoundPage } from "./pages/not-found";
import { OverviewPage } from "./pages/overview";
import { SidebarPage } from "./pages/sidebar";
import { SwitchPage } from "./pages/switch";
import { TabsPage } from "./pages/tabs";
import { TooltipPage } from "./pages/tooltip";
import { UsagePage } from "./pages/usage";

const componentPages: Record<string, ComponentType> = {
  button: ButtonPage,
  input: InputPage,
  checkbox: CheckBoxPage,
  switch: SwitchPage,
  sidebar: SidebarPage,
  tabs: TabsPage,
  dialog: DialogPage,
  tooltip: TooltipPage,
  marquee: MarqueePage,
};

function ComponentRoute() {
  const { slug } = useParams();
  const Page = slug ? componentPages[slug] : undefined;

  return Page ? <Page /> : <NotFoundPage />;
}

function HookRoute() {
  const { slug } = useParams();
  const doc = slug ? hookByPath.get(`hooks/${slug}`) : undefined;

  return doc ? <HookPage doc={doc} /> : <NotFoundPage />;
}

function OverviewRoute() {
  return <OverviewPage />;
}

/**
 * 使用 hash 路由，保证 GitHub Pages 子路径下刷新与深链接都能直接工作，
 * 不需要服务器回退规则。
 *
 * components/:slug 与 hooks/:slug 是动态段，新增页面只需往内容表里
 * 加一条，不用改路由表。
 */
export const router = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <OverviewRoute /> },
      { path: "usage", element: <UsagePage /> },
      { path: "customizing", element: <CustomizingPage /> },
      { path: "components/:slug", element: <ComponentRoute /> },
      { path: "hooks/:slug", element: <HookRoute /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
