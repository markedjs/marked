
var match = /#\/(.+)\\.md(.*)/g.exec(window.location.hash);
if (match && match[1]) {
  // Redirect from URL format to new URL, for example:
  // Old: https://marked.js.org/#/USING_PRO.md#renderer
  // New: https://marked.js.org/using_pro#renderer
  var pageName = match[1].toLowerCase();
  var sectionName = match[2];
  window.location.href = '/' + pageName + sectionName;
}

var navLinks = document.querySelectorAll('nav a');

function hashChange() {
  var fullUrl = window.location.href;
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
  var copyHTML = '<div class="div-copy">'
  + '<img src="/img/copy-icon.svg" class="icon-copy" title="Click to Copy" />'
  + '<span class="tooltip-text" disabled>Copied</span>'
  + '</div>';

  var getAllPre = document.querySelectorAll('pre');
  getAllPre.forEach(function(pre) {
    pre.append(copyHTML);
  });

  var getAllEl = document.querySelectorAll('.div-copy');
  getAllEl.forEach(function(el) {
    el.parentElement.onmouseover = function() {
      el.classList.add('active');
    };
    el.parentElement.onmouseleave = function() {
      el.classList.remove('active');
      el.classList.remove('click');
    };
    el.onclick = function() {
      navigator.clipboard.writeText(el.parentElement.textContent);
      el.classList.add('click');
      setTimeout(function() {
        el.classList.remove('click');
      }, 5000);
    };
  });
});
