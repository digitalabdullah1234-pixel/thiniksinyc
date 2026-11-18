/**
 * The admin's two looks: A "night" glass (dark, the site's night green) and
 * B "frost" glass (light). The choice lives in a cookie so the server paints
 * the right one first, with no flash.
 */
export type Theme = "night" | "frost";

export const THEME_COOKIE = "a-theme";

export const readTheme = (value: string | undefined): Theme => (value === "frost" ? "frost" : "night");
