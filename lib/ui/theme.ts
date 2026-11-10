export type ThemeChoice = "system" | "paper" | "sumi";

export const THEME_CHOICES: { id: ThemeChoice; label: string; jp: string }[] = [
  { id: "system", label: "System", jp: "自動" },
  { id: "paper", label: "Paper", jp: "和紙" },
  { id: "sumi", label: "Sumi", jp: "墨" },
];

export const THEME_STORAGE_KEY = "manabi.theme";

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "system" || value === "paper" || value === "sumi";
}

/** Applies a choice to <html>. "system" removes the attribute so CSS follows the OS. */
export function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Storage can be blocked (private mode); the choice still applies for this visit.
  }
}

export function readTheme(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeChoice(stored)) return stored;
  } catch {
    // ignore
  }
  return "system";
}

// Runs before first paint so a saved theme never flashes. Unknown values
// (including the old palette ids) fall back to "system".
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});if(t==="paper"||t==="sumi")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;
