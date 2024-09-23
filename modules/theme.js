document.addEventListener('DOMContentLoaded', function() {
  const themeToggler = document.getElementById('theme-toggler');
  const htmlElement = document.documentElement;

  // Check and apply the user's theme preference stored in localStorage
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    htmlElement.setAttribute('data-bs-theme', storedTheme);
    themeToggler.innerHTML = storedTheme === 'light' ?
      '<i class="bi bi-moon"></i><span class="ms-2">Switch to dark mode</span>' :
      '<i class="bi bi-sun"></i><span class="ms-2">Switch to light mode</span>';
  }

  // Toggle the theme when the user clicks the button
  themeToggler.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    themeToggler.innerHTML = newTheme === 'light' ?
      '<i class="bi bi-moon"></i><span class="ms-2">Switch to dark mode</span>' :
      '<i class="bi bi-sun"></i><span class="ms-2">Switch to light mode</span>';
    htmlElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme); // Store the user's preference
  });
});
