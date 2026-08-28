function slugify(texto) {
  return (texto || '')
    .toString()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // saca acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'categoria';
}

// Genera un slug único dentro de una lista de items ya existentes (excluyendo, opcionalmente, uno por id).
function slugUnico(nombre, items, idAExcluir) {
  const base = slugify(nombre);
  let slug = base;
  let n = 2;
  while (items.some((it) => it.slug === slug && it.id !== idAExcluir)) {
    slug = base + '-' + n;
    n += 1;
  }
  return slug;
}

module.exports = { slugify, slugUnico };
