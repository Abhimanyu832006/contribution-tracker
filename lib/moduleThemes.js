/**
 * Per-module color data for the dashboard's orbit/expansion transition.
 * These literal hex values must be kept byte-identical to the
 * corresponding --color-* custom properties in app/globals.css (both
 * :root and its prefers-color-scheme:dark block) — they exist only
 * because a JS-computed box-shadow value can't reference an unresolved
 * CSS custom property. Every actual rendered surface (tile background,
 * clone background) should keep using the CSS var directly instead.
 */
export const MODULE_THEMES = {
  contributions: { light: "#2b52ff", dark: "#5c7cff" },
  verification: { light: "#ff3d81", dark: "#ff6fa3" },
  reports: { light: "#caff33", dark: "#c8f24a" },
  team: { light: "#ff7a1a", dark: "#ff9c4d" },
  settings: { light: "#7c3aed", dark: "#a374ff" },
  log: { light: "#111111", dark: "#f2ede3" },
};

export function isDarkMode() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function getModuleTheme(key) {
  return MODULE_THEMES[key] ?? MODULE_THEMES.contributions;
}

/** A doubled hard-offset shadow tinted with the module's own color — never a soft blur, staying on-brand with the app's no-blur aesthetic. */
export function getModuleGlowShadow(key, dark = isDarkMode()) {
  const theme = getModuleTheme(key);
  const hex = dark ? theme.dark : theme.light;
  return `var(--shadow-brutal), 9px 9px 0 0 ${hex}`;
}
