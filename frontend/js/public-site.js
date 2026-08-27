// Dominio dedicado de la página pública de diplomados (sin login), separado
// del dominio del CRM. Se usa para armar los links que se comparten con clientes.
export const PUBLIC_SITE_URL = 'https://escuela-negocios-py-production.up.railway.app';

export function linkDiplomadoPublico(id) {
  return id ? `${PUBLIC_SITE_URL}/diplomados/${id}` : `${PUBLIC_SITE_URL}/diplomados`;
}
