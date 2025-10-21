document.addEventListener('DOMContentLoaded', function() {
    // --- Theme Toggling ---
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
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
        copyButton.className = 'absolute top-2 right-2 p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity';
        copyButton.innerHTML = '<span class="material-icons text-sm">content_copy</span>';
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
                copyButton.innerHTML = '<span class="material-icons text-sm">content_copy</span>';
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
});