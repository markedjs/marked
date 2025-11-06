document.addEventListener('DOMContentLoaded', function() {
  // --- Theme Toggling ---
  const themeToggle = document.getElementById('theme-toggle');

  // Function to apply theme
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Function to get saved theme or system preference
  function getPreferredTheme() {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    // Default to light
    return 'light';
  }

  // Apply theme on page load
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  // Theme toggle click handler
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      // Apply and save the new theme
      applyTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      // Only apply system preference if user hasn't manually set a preference
      if (!localStorage.getItem('theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // --- Navigation Link Highlighting ---
  const navLinks = document.querySelectorAll('nav a');
  const activeClasses = ['text-primary', 'dark:text-primary', 'font-medium'];
  const inactiveClasses = ['text-subtle-light', 'dark:text-subtle-dark'];

  function hashChange() {
    // Use location.pathname and location.hash for more accurate matching
    const currentUrl = window.location.pathname + window.location.hash;

    navLinks.forEach(function(link) {
      const linkUrl = new URL(link.href);
      const linkPath = linkUrl.pathname + linkUrl.hash;

      if (linkPath === currentUrl) {
        link.classList.add(...activeClasses);
        link.classList.remove(...inactiveClasses);
      } else {
        link.classList.remove(...activeClasses);
        link.classList.add(...inactiveClasses);
      }
    });
  }

  window.addEventListener('hashchange', hashChange);
  hashChange(); // Run on initial load

  // --- Copy-to-Clipboard Button ---
  const allPres = document.querySelectorAll('pre');
  allPres.forEach(function(pre) {
    let timeout = null;

    const copyButton = document.createElement('button');
    copyButton.className =
      'absolute top-2 right-2 p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity';
    copyButton.innerHTML =
      '<span class="material-icons text-sm">content_copy</span>';
    copyButton.setAttribute('aria-label', 'Copy to clipboard');

    pre.classList.add('group', 'relative'); // Add group for hover effect
    pre.appendChild(copyButton);

    copyButton.onclick = function() {
      // Exclude the button's own text from being copied
      const code = pre.querySelector('code').innerText;
      navigator.clipboard.writeText(code);

      copyButton.innerHTML = '<span class="material-icons text-sm">done</span>';

      clearTimeout(timeout);
      timeout = setTimeout(function() {
        copyButton.innerHTML =
          '<span class="material-icons text-sm">content_copy</span>';
      }, 2000);
    };
  });

  // --- LEGACY URL Redirect ---
  const match = /#\/(.+)\\.md(.*)/g.exec(window.location.hash);
  if (match && match[1]) {
    const pageName = match[1].toLowerCase();
    const sectionName = match[2];
    window.location.href = '/' + pageName + sectionName;
  }

  // --- Mobile Menu Toggle ---
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const body = document.body;

  function openMobileMenu() {
    sidebar.classList.add('mobile-open');
    mobileOverlay.classList.add('active');
    body.classList.add('mobile-menu-open');
    mobileMenuToggle.setAttribute('aria-expanded', 'true');
  }

  function closeMobileMenu() {
    sidebar.classList.remove('mobile-open');
    mobileOverlay.classList.remove('active');
    body.classList.remove('mobile-menu-open');
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
  }

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', function() {
      const isOpen = sidebar.classList.contains('mobile-open');
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', closeMobileMenu);
  }

  // Close mobile menu when clicking a navigation link
  if (sidebar) {
    const sidebarLinks = sidebar.querySelectorAll('a');
    sidebarLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        // Only close on mobile/tablet (up to 1024px)
        if (window.innerWidth <= 1024) {
          closeMobileMenu();
        }
      });
    });
  }

  // Close mobile menu on window resize to desktop size
  window.addEventListener('resize', function() {
    if (window.innerWidth > 1024) {
      closeMobileMenu();
    }
  });
});
