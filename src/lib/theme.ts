export const THEME_STORAGE_KEY = "journapp-theme";
export type ThemePreference = "system" | "light" | "dark";

/**
 * Runs before first paint (inlined in <head>) so the page never flashes the wrong theme.
 * Keep it tiny and dependency-free.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;
