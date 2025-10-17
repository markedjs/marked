// Theme functionality
function initTheme() {
  // SVG icon constants for better maintainability
  const SUN_ICON_SVG = '<circle cx="12" cy="12" r="4"></circle><path d="m12 2 0 2"></path><path d="m12 20 0 2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>';
  const MOON_ICON_SVG = '<path fill="currentColor" d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>';

  // Get stored theme preference or default to 'auto'
  const storedTheme = localStorage.getItem('theme') || 'auto';
  const html = document.documentElement;
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function applyThemeToIframes(theme) {
    const effectiveTheme = theme === 'auto'
      ? (darkModeQuery.matches ? 'dark' : 'light')
      : theme;

    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        const iframeDocument = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
        if (!iframeDocument || !iframeDocument.documentElement) {
          return;
        }

        if (theme === 'auto') {
          iframeDocument.documentElement.removeAttribute('data-theme');
        } else {
          iframeDocument.documentElement.setAttribute('data-theme', theme);
        }

        if (iframeDocument.documentElement.style) {
          iframeDocument.documentElement.style.colorScheme = effectiveTheme;
        }
      } catch (e) {
        // Ignore errors, iframe might be from another origin
      }
    });
  }

  // Expose helper for other scripts (e.g., demo page) to reapply theme on iframe load
  window.__markedApplyThemeToIframes = applyThemeToIframes;

  function setTheme(theme) {
    if (theme === 'auto') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', theme);
    }
    localStorage.setItem('theme', theme);
    updateToggleButton(theme);

    applyThemeToIframes(theme);
  }

  function updateToggleButton(theme) {
    const button = document.getElementById('theme-toggle');
    if (!button) return;

    const icon = button.querySelector('.icon');
    const text = button.querySelector('.text');

    if (theme === 'auto') {
      // Auto mode: show icon based on system preference
      const isDarkMode = darkModeQuery.matches;
      icon.innerHTML = isDarkMode ? MOON_ICON_SVG : SUN_ICON_SVG;
      text.textContent = 'Dark';
    } else if (theme === 'dark') {
      // Manual dark mode: show 'Light' (next action is to go to manual light)
      icon.innerHTML = MOON_ICON_SVG;
      text.textContent = 'Light';
    } else {
      // Manual light mode: show 'System' (next action is to go back to auto)
      icon.innerHTML = SUN_ICON_SVG;
      text.textContent = 'System';
    }
  }

  function cycleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'auto';
    let nextTheme;

    switch (currentTheme) {
      case 'auto':
        nextTheme = 'dark';
        break;
      case 'dark':
        nextTheme = 'light';
        break;
      case 'light':
        nextTheme = 'auto';
        break;
      default:
        nextTheme = 'dark';
    }

    setTheme(nextTheme);
  }

  // Initialize theme
  setTheme(storedTheme);

  // Listen for system theme changes
  darkModeQuery.addEventListener('change', () => {
    if (localStorage.getItem('theme') === 'auto') {
      updateToggleButton('auto');
      applyThemeToIframes('auto');
    }
  });

  // Add click handler for toggle button
  document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('theme-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', cycleTheme);
    }
  });
}

// Initialize theme as early as possible
initTheme();

const match = /#\/(.+)\\.md(.*)/g.exec(window.location.hash);
if (match && match[1]) {
  // Redirect from URL format to new URL, for example:
  // Old: https://marked.js.org/#/USING_PRO.md#renderer
  // New: https://marked.js.org/using_pro#renderer
  const pageName = match[1].toLowerCase();
  const sectionName = match[2];
  window.location.href = '/' + pageName + sectionName;
}

const navLinks = document.querySelectorAll('nav a');

function hashChange() {
  const fullUrl = window.location.href;
  navLinks.forEach(function(link) {
    link.className = link.href === fullUrl ? 'selected' : '';
  });
}

window.addEventListener('hashchange', function(e) {
  e.preventDefault();
  hashChange();
});

hashChange();

document.addEventListener('DOMContentLoaded', function() {
  const div = document.createElement('div');
  div.innerHTML = '<div class="tooltip-copy"><img src="/img/copy-icon.svg" class="icon-copy" title="Click to Copy" /></div>';
  div.className = 'div-copy';

  const allPres = document.querySelectorAll('pre');
  allPres.forEach(function(pre) {
    let timeout = null;
    const copy = div.cloneNode(true);
    pre.appendChild(copy);
    pre.onmouseover = function() {
      copy.classList.add('active');
    };
    pre.onmouseleave = function() {
      clearTimeout(timeout);
      copy.classList.remove('active');
      copy.classList.remove('click');
    };
    copy.onclick = function() {
      navigator.clipboard.writeText(pre.textContent);
      copy.classList.add('click');
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        copy.classList.remove('click');
      }, 3000);
    };
  });
});
