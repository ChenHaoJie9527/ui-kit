import { useEffect } from "react";
import { useLocalStorage } from "@momotom/hooks";

export type ThemeMode = "system" | "light" | "dark";

export const THEME_MODES: ThemeMode[] = ["system", "light", "dark"];

const STORAGE_KEY = "ui-kit-docs-theme";

function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;

  if (mode === "system") {
    delete root.dataset.theme;
    root.style.colorScheme = "";
    return;
  }

  root.dataset.theme = mode;
  root.style.colorScheme = mode;
}

/**
 * 文档站主题：system / light / dark，选择会写入 localStorage。
 *
 * 主题通过 data-theme + color-scheme 生效，CSS 用 light-dark() 取色，
 * 因此和组件库自身的 token 保持同步。
 */
export function useTheme(): {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
} {
  const [mode, setMode] = useLocalStorage<ThemeMode>(STORAGE_KEY, "system");

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  return { mode, setMode };
}
