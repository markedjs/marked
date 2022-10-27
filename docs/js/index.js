document.addEventListener('DOMContentLoaded', function() {
  var div = document.createElement('div');
  div.innerHTML = '<img src="/img/copy-icon.svg" class="icon-copy" title="Click to Copy" /> <span class="tooltip-text" disabled>Copied</span>';
  div.className = 'div-copy';

  var getAllPre = document.querySelectorAll('pre');

  for (var i = 0; i < getAllPre.length; i++) {
    getAllPre[i].appendChild(div.cloneNode(true));
  }

  var getAllEl = document.querySelectorAll('.div-copy');
  getAllEl.forEach(function(pre) {
    pre.onclick = function() {
      var copyText = document.createElement('textarea');
      copyText.value = pre.parentElement.textContent;
      var lastIndex = copyText.value.lastIndexOf(' ');
      copyText.value = copyText.value.substring(0, lastIndex);
      document.body.appendChild(copyText);
      copyText.select();
      copyText.setSelectionRange(0, 99999);
      navigator.clipboard.writeText(copyText.value);
      document.body.removeChild(copyText);
      pre.classList.add('active');
      setTimeout(function() {
        pre.classList.remove('active');
      }, 5000);
    };
  });
});
