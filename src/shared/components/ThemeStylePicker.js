"use client";

import { useTheme } from "@/shared/hooks/useTheme";
import { HACKER_THEMES, BASE_THEMES } from "@/shared/constants/config";
import { cn } from "@/shared/utils/cn";

const modeIcons = {
  light: "light_mode",
  dark: "dark_mode",
  system: "contrast",
};

/**
 * Appearance picker: four hacker palettes plus the original light/dark/system
 * base modes. Selecting a hacker theme forces dark mode; selecting a base mode
 * clears the hacker palette.
 */
export default function ThemeStylePicker({ compact = false }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-4">
      <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
        {HACKER_THEMES.map((option) => {
          const active = theme === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              aria-pressed={active}
              className={cn(
                "relative flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all",
                "bg-black/20 hover:bg-black/40",
                active
                  ? "border-primary shadow-[var(--shadow-warm)]"
                  : "border-border hover:border-primary/50"
              )}
            >
              <span
                className="size-5 rounded-sm shrink-0"
                style={{ background: option.swatch, boxShadow: `0 0 12px ${option.swatch}66` }}
              />
              <span className="text-sm font-semibold">{option.name}</span>
              {!compact && <span className="text-[11px] text-text-muted leading-tight">{option.tagline}</span>}
              {active && (
                <span
                  className="material-symbols-outlined absolute right-2 top-2 text-[16px] text-primary"
                  aria-hidden="true"
                >
                  check
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-text-muted mr-1">Classic mode</span>
        <div className="inline-flex p-1 rounded-lg bg-black/10 dark:bg-white/5">
          {BASE_THEMES.map((option) => {
            const active = theme === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                aria-pressed={active}
                title={`Switch to ${option} mode`}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                  active
                    ? "bg-white dark:bg-white/10 text-text-main shadow-sm"
                    : "text-text-muted hover:text-text-main"
                )}
              >
                <span className="material-symbols-outlined text-[16px]">{modeIcons[option]}</span>
                <span className="capitalize">{option}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
