document.addEventListener('DOMContentLoaded', function() {
  const themeToggler = document.getElementById('theme-toggler');
  const htmlElement = document.documentElement;

  const lightThemeHTML = '<i class="bi bi-moon"></i><span class="ms-2">Switch to dark mode</span>';
  const darkThemeHTML = '<i class="bi bi-sun"></i><span class="ms-2">Switch to light mode</span>';

  // Check and apply the user's theme preference stored in localStorage.
  // If not found, default to the system preference
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    htmlElement.setAttribute('data-bs-theme', storedTheme);
    themeToggler.innerHTML = storedTheme === 'light' ?
      lightThemeHTML :
      darkThemeHTML;
  } else {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    htmlElement.setAttribute('data-bs-theme', systemTheme);
    themeToggler.innerHTML = systemTheme === 'light' ?
      lightThemeHTML :
      darkThemeHTML;
  }

  // Toggle the theme when the user clicks the button
  themeToggler.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    themeToggler.innerHTML = newTheme === 'light' ?
      lightThemeHTML :
      darkThemeHTML;
    htmlElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme); // Store the user's preference
  });
});
