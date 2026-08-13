// Normaliza un teléfono paraguayo a formato internacional (595...) para wa.me / api.whatsapp.com.
export function formatearTelefonoPy(telefono) {
  let tel = (telefono || '').replace(/\D/g, '');
  if (tel.startsWith('0')) {
    tel = '595' + tel.substring(1);
  } else if (!tel.startsWith('595')) {
    tel = '595' + tel;
  }
  return tel;
}

export function abrirWhatsapp(telefono, mensaje = '') {
  const tel = formatearTelefonoPy(telefono);
  if (!tel) return false;
  const txt = mensaje ? `&text=${encodeURIComponent(mensaje)}` : '';
  window.open(`https://api.whatsapp.com/send?phone=${tel}${txt}`, '_blank');
  return true;
}
