// Cliente HTTP hacia la API del panel. Agrega el token de sesión y normaliza errores.
const Api = (function () {
  function token() {
    return localStorage.getItem('jc_token');
  }

  async function req(method, path, body, isForm) {
    const headers = {};
    const t = token();
    if (t) headers.Authorization = 'Bearer ' + t;
    if (!isForm) headers['Content-Type'] = 'application/json';

    const res = await fetch('/api' + path, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });

    if (res.status === 401) {
      localStorage.removeItem('jc_token');
      localStorage.removeItem('jc_usuario');
      if (window.App && window.App.mostrarLogin) window.App.mostrarLogin('Tu sesión expiró. Iniciá sesión de nuevo.');
      throw new Error('Sesión expirada.');
    }

    if (res.status === 204) return null;

    let data = null;
    try { data = await res.json(); } catch { /* respuesta sin cuerpo */ }

    if (!res.ok) throw new Error((data && data.error) || 'Ocurrió un error inesperado.');
    return data;
  }

  return {
    get: (path) => req('GET', path),
    post: (path, body) => req('POST', path, body),
    put: (path, body) => req('PUT', path, body),
    del: (path) => req('DELETE', path),
    upload: (path, formData) => req('POST', path, formData, true),
    token,
  };
})();
