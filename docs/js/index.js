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
