"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import useThemeStore from "@/store/themeStore";
import { isHackerTheme } from "@/shared/constants/config";

// Subscribe to system theme changes
function subscribeToSystemTheme(callback) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

// Get current system theme preference
function getSystemThemeSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// Server snapshot always returns false
function getServerSnapshot() {
  return false;
}

export function useTheme() {
  const { theme, setTheme, toggleTheme, initTheme } = useThemeStore();

  // Use useSyncExternalStore to safely subscribe to system theme
  const systemPrefersDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemThemeSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Listen for system theme changes when theme is "system"
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => initTheme();

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, initTheme]);

  // Hacker themes are always dark, regardless of the base mode.
  const hackerTheme = isHackerTheme(theme);
  const isDark = theme === "dark" || hackerTheme || (theme === "system" && systemPrefersDark);

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark,
    hackerTheme,
  };
}

