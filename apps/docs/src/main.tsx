import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { ToastProvider } from "@momotom/ui";
import { router } from "./routes";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider placement="bottom-right">
      <RouterProvider router={router} />
    </ToastProvider>
  </StrictMode>,
);
