"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { THEME_CONFIG, isHackerTheme } from "@/shared/constants/config";

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: THEME_CONFIG.defaultTheme,

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === "dark" || isHackerTheme(currentTheme) ? "light" : "dark";
        set({ theme: newTheme });
        applyTheme(newTheme);
      },

      initTheme: () => {
        const theme = get().theme;
        applyTheme(theme);
      },
    }),
    {
      name: THEME_CONFIG.storageKey,
    }
  )
);

// Apply theme to document. Hacker themes are all dark and are exposed as a
// data attribute so CSS can swap the full palette without touching components.
export function applyTheme(theme) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

  const effectiveTheme = theme === "system" ? systemTheme : theme;

  if (isHackerTheme(theme)) {
    root.setAttribute("data-hacker-theme", theme);
  } else {
    root.removeAttribute("data-hacker-theme");
  }

  if (effectiveTheme === "dark" || isHackerTheme(theme)) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export default useThemeStore;
