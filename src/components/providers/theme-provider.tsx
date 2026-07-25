"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

export type ThemeMode = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

const STORAGE_KEY = "peerfootball.theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

export const themeInitializationScript = `
(() => {
  try {
    const stored = localStorage.getItem("${STORAGE_KEY}");
    const theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "light";
    const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  } catch {}
})();
`;

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function applyTheme(theme: ThemeMode, prefersDark: boolean) {
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof document === "undefined") {
      return "light";
    }
    const initializedTheme = document.documentElement.dataset.theme ?? null;
    return isThemeMode(initializedTheme) ? initializedTheme : "light";
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => applyTheme(theme, media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [theme]);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // The in-memory preference still applies when browser storage is unavailable.
    }
    setThemeState(nextTheme);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [setTheme, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }
  return value;
}
