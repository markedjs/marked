document.addEventListener('DOMContentLoaded', function() {
  // --- Theme Toggling ---
  const themeToggle = document.getElementById('theme-toggle');
  const themeToggleIcon = themeToggle ? themeToggle.querySelector('[data-theme-icon]') : null;
  const themeToggleText = themeToggle ? themeToggle.querySelector('[data-theme-text]') : null;

  const THEME_STORAGE_KEY = 'theme-preference';
  const LEGACY_STORAGE_KEY = 'theme';
  const THEME_ORDER = ['system', 'light', 'dark'];
  const TOGGLE_UI = {
    system: { icon: 'brightness_auto', text: 'System' },
    light: { icon: 'light_mode', text: 'Light' },
    dark: { icon: 'dark_mode', text: 'Dark' },
  };

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.setAttribute('data-theme', theme);
  }

  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function sanitisePreference(value) {
    return value === 'dark' || value === 'light' || value === 'system' ? value : null;
  }

  function readStoredPreference() {
    try {
      const stored = sanitisePreference(localStorage.getItem(THEME_STORAGE_KEY));
      if (stored) {
        return stored;
      }
      return sanitisePreference(localStorage.getItem(LEGACY_STORAGE_KEY));
    } catch {
      return null;
    }
  }

  function writeStoredPreference(preference) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
      if (preference === 'light' || preference === 'dark') {
        localStorage.setItem(LEGACY_STORAGE_KEY, preference);
      } else {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    } catch {
      // Storage might be unavailable; ignore
    }
  }

  function getEffectiveTheme(preference) {
    return preference === 'system' ? getSystemTheme() : preference;
  }

  function updateToggle(preference) {
    if (!themeToggle) {
      return;
    }
    const details = TOGGLE_UI[preference] || TOGGLE_UI.system;
    if (themeToggleIcon) {
      themeToggleIcon.textContent = details.icon;
    }
    if (themeToggleText) {
      themeToggleText.textContent = details.text;
    }
    themeToggle.setAttribute('data-theme-mode', preference);
    const label = `Switch theme (current: ${details.text})`;
    themeToggle.setAttribute('aria-label', label);
    themeToggle.title = label;
  }

  let currentPreference = readStoredPreference() || 'system';

  function applyPreference(preference, persist) {
    currentPreference = preference;
    const effectiveTheme = getEffectiveTheme(preference);
    applyTheme(effectiveTheme);
    document.documentElement.setAttribute('data-theme-preference', preference);
    updateToggle(preference);
    if (persist) {
      writeStoredPreference(preference);
    }
  }

  applyPreference(currentPreference, true);

  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      const index = THEME_ORDER.indexOf(currentPreference);
      const nextIndex = index === -1 ? 0 : (index + 1) % THEME_ORDER.length;
      const nextPreference = THEME_ORDER[nextIndex];
      applyPreference(nextPreference, true);
    });
  }

  const systemMatcher = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  if (systemMatcher) {
    const handleSystemChange = function() {
      if (currentPreference === 'system') {
        applyPreference('system', false);
      }
    };

    if (typeof systemMatcher.addEventListener === 'function') {
      systemMatcher.addEventListener('change', handleSystemChange);
    } else if (typeof systemMatcher.addListener === 'function') {
      systemMatcher.addListener(handleSystemChange);
    }
  }

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
