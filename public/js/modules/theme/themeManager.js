/**
 * @fileoverview Theme management module
 * Handles light/dark theme switching and persistence
 */

import { THEMES, STORAGE_KEYS } from "../../config/constants.js";
import { socket } from "../../core/socket.js";

/**
 * Current theme setting
 * @type {'light'|'dark'}
 */
let currentTheme = THEMES.LIGHT;

/**
 * Get current theme
 * @returns {'light'|'dark'} Current theme
 */
export function getCurrentTheme() {
  return currentTheme;
}

/**
 * Apply theme to the document
 * @param {'light'|'dark'} theme - Theme to apply
 */
export function applyTheme(theme) {
  if (theme !== THEMES.LIGHT && theme !== THEMES.DARK) return;

  currentTheme = theme;
  const html = document.documentElement;
  html.setAttribute("data-theme", theme);
  updateIcon(theme);
}

/**
 * Toggle between light and dark themes
 * @returns {'light'|'dark'} New theme after toggle
 */
export function toggleTheme() {
  const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
  applyTheme(newTheme);

  // Send theme change to server
  socket.emit("themeChange", { theme: newTheme });

  return newTheme;
}

/**
 * Initialize theme system
 * Sets up initial theme and icon
 */
export function initializeTheme() {
  applyTheme(currentTheme);
}

/**
 * Update theme icon based on current theme
 * @param {'light'|'dark'} theme - Current theme
 */
function updateIcon(theme) {
  const themeIcon = document.getElementById("theme-icon");
  if (themeIcon) {
    if (theme === THEMES.DARK) {
      themeIcon.classList.remove("fa-moon");
      themeIcon.classList.add("fa-sun");
    } else {
      themeIcon.classList.remove("fa-sun");
      themeIcon.classList.add("fa-moon");
    }
  }
}

/**
 * Set up theme toggle button event listener
 */
export function setupThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      toggleTheme();
    });
  }
}
