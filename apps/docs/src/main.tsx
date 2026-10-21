import { StrictMode } from "react";
// 必须最先导入：它带进来的 Tailwind 层要排在组件库之前。
import "./app.css";
import "../../../packages/ui/src/styles.css";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./routes";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
