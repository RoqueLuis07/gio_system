// Genera una imagen a partir de la primera página de un PDF, usando pdf.js
// (copia local en js/vendor/pdfjs/, sin depender de ningún CDN).
let pdfjsLibPromise = null;

function getPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('./vendor/pdfjs/pdf.min.mjs').then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
      return lib;
    });
  }
  return pdfjsLibPromise;
}

export async function primeraPaginaComoImagen(file) {
  const pdfjsLib = await getPdfjs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');

  await page.render({ canvasContext: ctx, viewport }).promise;

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob ? new File([blob], 'brochure-portada.png', { type: 'image/png' }) : null);
    }, 'image/png');
  });
}
