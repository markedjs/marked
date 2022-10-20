document.addEventListener("DOMContentLoaded", () => {  
    const div = document.createElement('div');
    div.innerHTML = "<img src='/img/copy-icon.svg' class='icon-copy' title='Click to Copy' /> <span class='tooltip-text' disabled>Copied</span>"
    div.className = "div-copy"
  
    const getAllPre = document.querySelectorAll('pre')

    for (let i = 0; i < getAllPre.length; i++) {
        getAllPre[i].appendChild(div.cloneNode(true));
    }

    const getAllEl = document.querySelectorAll(".div-copy");
    getAllEl.forEach(pre => {
        pre.onclick = () => {
            const copyText = document.createElement('textarea');
            copyText.value = pre.parentElement.textContent
            const lastIndex = copyText.value.lastIndexOf(" ");
            copyText.value = copyText.value.substring(0, lastIndex);
            document.body.appendChild(copyText);
            copyText.select();
            document.execCommand('copy');
            document.body.removeChild(copyText);
            
            pre.classList.add('active');
            setTimeout(() => {
                pre.classList.remove('active');
            }, 5000)
        }
    })
});