const API_BASE = '/api';

async function request(method, path, body) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error) || 'Ocurrió un error al comunicarse con el servidor.');
  }
  return data;
}

async function requestForm(method, path, formData) {
  const res = await fetch(API_BASE + path, { method, body: formData });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error) || 'Ocurrió un error al comunicarse con el servidor.');
  }
  return data;
}

export const api = {
  getState: () => request('GET', '/state'),

  login: (usuario, pass) => request('POST', '/auth/login', { usuario, pass }),
  updateProfile: (id, nombre, pass) => request('PUT', '/auth/profile', { id, nombre, pass }),
  uploadFoto: (formData) => requestForm('POST', '/auth/profile/foto', formData),

  usuarios: {
    list: () => request('GET', '/usuarios'),
    create: (data) => request('POST', '/usuarios', data),
    update: (id, data) => request('PUT', `/usuarios/${id}`, data),
    remove: (id) => request('DELETE', `/usuarios/${id}`),
  },

  productos: {
    create: (data) => request('POST', '/productos', data),
    update: (id, data) => request('PUT', `/productos/${id}`, data),
    remove: (id) => request('DELETE', `/productos/${id}`),
    uploadFoto: (id, formData) => requestForm('POST', `/productos/${id}/foto`, formData),
    uploadBrochure: (id, formData) => requestForm('POST', `/productos/${id}/brochure`, formData),
  },

  ventas: {
    create: (data) => request('POST', '/ventas', data),
    update: (id, data) => request('PUT', `/ventas/${id}`, data),
    remove: (id) => request('DELETE', `/ventas/${id}`),
    bulkCreate: (data) => request('POST', '/ventas/bulk', data),
  },

  prospectos: {
    create: (data) => request('POST', '/prospectos', data),
    update: (id, data) => request('PUT', `/prospectos/${id}`, data),
    remove: (id) => request('DELETE', `/prospectos/${id}`),
  },

  recordatorios: {
    create: (data) => request('POST', '/recordatorios', data),
    update: (id, data) => request('PUT', `/recordatorios/${id}`, data),
    remove: (id) => request('DELETE', `/recordatorios/${id}`),
  },

  plantillas: {
    create: (data) => request('POST', '/plantillas', data),
    update: (id, data) => request('PUT', `/plantillas/${id}`, data),
    remove: (id) => request('DELETE', `/plantillas/${id}`),
  },

  parametros: {
    update: (data) => request('PUT', '/parametros', data),
  },

  archivos: {
    list: () => request('GET', '/archivos'),
    upload: (formData) => requestForm('POST', '/archivos', formData),
    rename: (id, nombre) => request('PUT', `/archivos/${id}`, { nombre }),
    remove: (id) => request('DELETE', `/archivos/${id}`),
  },

  enlaces: {
    create: (data) => request('POST', '/enlaces', data),
    update: (id, data) => request('PUT', `/enlaces/${id}`, data),
    remove: (id) => request('DELETE', `/enlaces/${id}`),
  },

  email: {
    send: (data) => request('POST', '/email/enviar', data),
    bulkSend: (data) => request('POST', '/email/bulk', data),
  },

  gruposEnvio: {
    create: (data) => request('POST', '/grupos-envio', data),
    update: (id, data) => request('PUT', `/grupos-envio/${id}`, data),
    remove: (id) => request('DELETE', `/grupos-envio/${id}`),
  },

};
