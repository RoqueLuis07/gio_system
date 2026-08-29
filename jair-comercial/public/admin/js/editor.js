// Mini editor de texto enriquecido (estilo WordPress: negrita, cursiva, listas,
// links) basado en contenteditable + execCommand. Sin dependencias externas.
function crearEditorRico(mountEl, htmlInicial) {
  mountEl.innerHTML = '';
  mountEl.classList.add('rich-editor');

  const toolbar = document.createElement('div');
  toolbar.className = 'rich-toolbar';

  const botones = [
    { cmd: 'bold', label: '<b>N</b>', title: 'Negrita' },
    { cmd: 'italic', label: '<i>K</i>', title: 'Cursiva' },
    { cmd: 'underline', label: '<u>S</u>', title: 'Subrayado' },
    { cmd: 'insertUnorderedList', label: '• Lista', title: 'Lista con viñetas' },
    { cmd: 'insertOrderedList', label: '1. Lista', title: 'Lista numerada' },
    { cmd: 'link', label: '🔗', title: 'Insertar enlace' },
    { cmd: 'removeFormat', label: '✕', title: 'Quitar formato' },
  ];

  const area = document.createElement('div');
  area.className = 'rich-area';
  area.contentEditable = 'true';
  area.innerHTML = htmlInicial || '';

  botones.forEach((b) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rich-btn';
    btn.innerHTML = b.label;
    btn.title = b.title;
    btn.addEventListener('mousedown', (e) => e.preventDefault()); // no perder selección
    btn.addEventListener('click', () => {
      area.focus();
      if (b.cmd === 'link') {
        const url = prompt('URL del enlace (https://...)');
        if (url) document.execCommand('createLink', false, url);
      } else {
        document.execCommand(b.cmd, false, null);
      }
    });
    toolbar.appendChild(btn);
  });

  mountEl.appendChild(toolbar);
  mountEl.appendChild(area);

  return {
    getHtml: () => area.innerHTML,
    setHtml: (html) => { area.innerHTML = html || ''; },
    focus: () => area.focus(),
  };
}
