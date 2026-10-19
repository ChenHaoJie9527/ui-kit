import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "@ui-kit/ui";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider placement="bottom-right">
      <App />
    </ToastProvider>
  </StrictMode>,
);
