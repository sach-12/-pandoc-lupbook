/*
 * Copyright (c) 2023 LupLab
 * SPDX-License-Identifier: AGPL-3.0-only
 */

class ThemeToggler {
  themeToggler;
  htmlElement;

  constructor() {
    /* Initialize DOM elements */
    this.themeToggler = document.getElementById('theme-toggler');
    this.htmlElement = document.documentElement;

    /* Load and apply initial theme based on system settings */
    this.applySystemTheme();

    /* Attach event listener to theme toggler */
    this.attachEventListeners();
  }

  /* Method to apply the system's preferred theme */
  applySystemTheme() {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    this.applyTheme(systemTheme);
    this.themeToggler.checked = systemTheme === 'dark'; // Sync toggle with theme
  }

  /* Method to apply the theme */
  applyTheme(theme) {
    this.htmlElement.setAttribute('data-bs-theme', theme);
  }

  /* Method to toggle between light and dark themes */
  toggleTheme() {
    const newTheme = this.themeToggler.checked ? 'dark' : 'light';
    this.applyTheme(newTheme);
  }

  /* Method to attach event listener for theme toggling */
  attachEventListeners() {
    this.themeToggler.addEventListener('change', () => this.toggleTheme());
  }
}

/* Initialize Theme Toggler functionality after page load */
window.addEventListener('DOMContentLoaded', () => {
  new ThemeToggler();
});
