export type ThemeId =
  | "manabi"
  | "sumi"
  | "matcha"
  | "yozora"
  | "sunset";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  jp: string;
  description: string;
  /** Three swatches for the picker preview (left → right). */
  swatches: [string, string, string];
}

export const THEMES: ThemeMeta[] = [
  {
    id: "manabi",
    name: "Manabi",
    jp: "学び",
    description: "Indigo aurora, sakura blush.",
    swatches: ["#5b53ee", "#FF6FA3", "#F5C97B"],
  },
  {
    id: "sumi",
    name: "Sumi",
    jp: "墨",
    description: "Pure black, white ink.",
    swatches: ["#FFFFFF", "#BFBFBF", "#666666"],
  },
  {
    id: "matcha",
    name: "Matcha",
    jp: "抹茶",
    description: "Tea green, warm gold.",
    swatches: ["#4FA15A", "#B8E5BC", "#F5C97B"],
  },
  {
    id: "yozora",
    name: "Yozora",
    jp: "夜空",
    description: "Midnight sky, cyan stars.",
    swatches: ["#2266EB", "#76C8FF", "#BFA8FF"],
  },
  {
    id: "sunset",
    name: "Sunset",
    jp: "夕焼け",
    description: "Burnt orange, soft rose.",
    swatches: ["#FF7A41", "#FF7AA8", "#F5C97B"],
  },
];

export const DEFAULT_THEME: ThemeId = "manabi";
export const THEME_STORAGE_KEY = "manabi.theme";

export function isThemeId(value: unknown): value is ThemeId {
  return (
    typeof value === "string" &&
    THEMES.some((t) => t.id === value)
  );
}
