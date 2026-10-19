import { StrictMode } from "react";
// 必须最先导入：声明全局 @layer 顺序。
// 若组件库的 CSS 先被收集，层顺序会被抢定，Tailwind 的 utilities
// 就会排到 uk.components 之前，className 里的工具类再也覆盖不了组件。
import "./layers.css";
import "./app.css";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { ToastProvider } from "@chenhaojie9527/ui-kit";
import { router } from "./routes";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider placement="bottom-right">
      <RouterProvider router={router} />
    </ToastProvider>
  </StrictMode>,
);
