window.Views = window.Views || {};

Views.parametros = (function () {
  let p = null;
  let logoUrl = null;
  let bannerUrl = null;
  let metodosPago = [];

  async function render(container) {
    container.innerHTML = '<div class="loading">Cargando…</div>';
    p = await Api.get('/parametros');
    logoUrl = p.empresa.logoUrl;
    bannerUrl = p.banner.imagenUrl;
    metodosPago = (p.metodosPago && p.metodosPago.length) ? [...p.metodosPago] : ['Efectivo'];

    container.innerHTML = `
      <form id="par-form" class="settings-form">

        <section class="settings-section">
          <h3>🏢 Datos de la empresa</h3>
          <div class="form-grid">
            <label class="span-2">Nombre de la empresa
              <input id="f-nombre" type="text" value="${escapeAttr(p.empresa.nombre)}" required />
            </label>
            <label class="span-2">Eslogan
              <input id="f-eslogan" type="text" value="${escapeAttr(p.empresa.eslogan)}" />
            </label>
            <label class="span-2">Descripción (sección "Sobre nosotros" del sitio)
              <textarea id="f-descripcion" rows="3">${escapeHtml(p.empresa.descripcion)}</textarea>
            </label>
            <div class="span-2">
              <span class="field-label">Logo</span>
              <div class="logo-upload">
                <div class="logo-preview" id="logo-preview">${logoUrl ? `<img src="${logoUrl}" alt="" />` : '🖼️'}</div>
                <input id="f-logo-input" type="file" accept="image/*" hidden />
                <button type="button" class="btn btn-ghost btn-sm" id="btn-subir-logo">Cambiar logo</button>
              </div>
            </div>
          </div>
        </section>

        <section class="settings-section">
          <h3>💬 WhatsApp y contacto</h3>
          <div class="form-grid">
            <label>Número de WhatsApp (con código de país, solo números)
              <input id="f-whatsapp" type="text" value="${escapeAttr(p.contacto.whatsapp)}" required placeholder="Ej: 595981000000" />
            </label>
            <label>Teléfono (opcional, se muestra en el pie de página)
              <input id="f-telefono" type="text" value="${escapeAttr(p.contacto.telefono)}" />
            </label>
            <label>Email
              <input id="f-email" type="email" value="${escapeAttr(p.contacto.email)}" />
            </label>
            <label>Horario de atención
              <input id="f-horario" type="text" value="${escapeAttr(p.contacto.horario)}" />
            </label>
            <label class="span-2">Dirección
              <input id="f-direccion" type="text" value="${escapeAttr(p.contacto.direccion)}" />
            </label>
            <label class="span-2">Mensaje automático al escribir por WhatsApp (usá <code>{producto}</code> para el nombre del producto)
              <input id="f-mensaje-wa" type="text" value="${escapeAttr(p.mensajeWhatsapp)}" />
            </label>
          </div>
        </section>

        <section class="settings-section">
          <h3>📢 Banner principal (portada del sitio)</h3>
          <div class="form-grid">
            <label class="span-2">Título
              <input id="f-banner-titulo" type="text" value="${escapeAttr(p.banner.titulo)}" />
            </label>
            <label class="span-2">Subtítulo
              <input id="f-banner-subtitulo" type="text" value="${escapeAttr(p.banner.subtitulo)}" />
            </label>
            <label>Texto del botón principal
              <input id="f-banner-boton" type="text" value="${escapeAttr(p.banner.textoBoton)}" />
            </label>
          </div>
        </section>

        <section class="settings-section">
          <h3>🧩 Catálogo del inicio</h3>
          <div class="form-grid">
            <label>Productos por categoría en el inicio
              <input id="f-cat-cantidad" type="number" min="3" max="30" value="${(p.catalogo && p.catalogo.productosPorCategoriaHome) || 10}" />
            </label>
            <p class="span-2 muted" style="margin:0;">Cada categoría muestra hasta esta cantidad en su fila del inicio (ordenados por el campo "Orden" de cada producto — el más bajo aparece primero). Si hay más productos que este número, aparece el botón "Ver todas" para esa categoría.</p>
          </div>
        </section>

        <section class="settings-section">
          <h3>💳 Formas de pago</h3>
          <p class="muted" style="margin:-6px 0 12px;">Las que carguen los vendedores al registrar una venta.</p>
          <div id="metodos-lista" class="chip-lista"></div>
          <div class="chip-agregar">
            <input id="f-metodo-nuevo" type="text" placeholder="Ej: Giro Tigo Money" />
            <button type="button" class="btn btn-ghost btn-sm" id="btn-agregar-metodo">➕ Agregar</button>
          </div>
        </section>

        <section class="settings-section">
          <h3>🎨 Colores del sitio</h3>
          <div class="form-grid">
            <label>Color primario
              <input id="f-color-1" type="color" value="${p.tema.colorPrimario}" />
            </label>
            <label>Color secundario
              <input id="f-color-2" type="color" value="${p.tema.colorSecundario}" />
            </label>
          </div>
        </section>

        <section class="settings-section">
          <h3>🔗 Redes sociales (opcional)</h3>
          <div class="form-grid">
            <label>Facebook (link completo)
              <input id="f-facebook" type="text" value="${escapeAttr(p.redes.facebook)}" placeholder="https://facebook.com/..." />
            </label>
            <label>Instagram (link completo)
              <input id="f-instagram" type="text" value="${escapeAttr(p.redes.instagram)}" placeholder="https://instagram.com/..." />
            </label>
            <label>TikTok (link completo)
              <input id="f-tiktok" type="text" value="${escapeAttr(p.redes.tiktok)}" placeholder="https://tiktok.com/@..." />
            </label>
          </div>
        </section>

        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">💾 Guardar todos los cambios</button>
        </div>
      </form>
    `;

    document.getElementById('btn-subir-logo').addEventListener('click', () => document.getElementById('f-logo-input').click());
    document.getElementById('f-logo-input').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('archivo', file);
      try {
        const { url } = await Api.upload('/upload', fd);
        logoUrl = url;
        document.getElementById('logo-preview').innerHTML = `<img src="${url}" alt="" />`;
        Toast.ok('Logo subido. No olvides guardar los cambios.');
      } catch (err) {
        Toast.error(err.message);
      }
    });

    pintarMetodos();
    document.getElementById('btn-agregar-metodo').addEventListener('click', agregarMetodo);
    document.getElementById('f-metodo-nuevo').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); agregarMetodo(); }
    });

    document.getElementById('par-form').addEventListener('submit', guardar);
  }

  function pintarMetodos() {
    const el = document.getElementById('metodos-lista');
    el.innerHTML = metodosPago.map((m, i) => `
      <span class="chip">${escapeHtml(m)} <button type="button" data-quitar="${i}" aria-label="Quitar">✕</button></span>
    `).join('') || '<span class="muted">Sin formas de pago cargadas.</span>';
    el.querySelectorAll('[data-quitar]').forEach((btn) => {
      btn.addEventListener('click', () => {
        metodosPago.splice(Number(btn.dataset.quitar), 1);
        pintarMetodos();
      });
    });
  }

  function agregarMetodo() {
    const input = document.getElementById('f-metodo-nuevo');
    const valor = input.value.trim();
    if (!valor) return;
    if (metodosPago.some((m) => m.toLowerCase() === valor.toLowerCase())) { Toast.error('Esa forma de pago ya está en la lista.'); return; }
    metodosPago.push(valor);
    input.value = '';
    pintarMetodos();
  }

  async function guardar(e) {
    e.preventDefault();
    const body = {
      empresa: {
        nombre: document.getElementById('f-nombre').value.trim(),
        eslogan: document.getElementById('f-eslogan').value.trim(),
        descripcion: document.getElementById('f-descripcion').value.trim(),
        logoUrl,
      },
      contacto: {
        whatsapp: document.getElementById('f-whatsapp').value.trim(),
        telefono: document.getElementById('f-telefono').value.trim(),
        email: document.getElementById('f-email').value.trim(),
        horario: document.getElementById('f-horario').value.trim(),
        direccion: document.getElementById('f-direccion').value.trim(),
      },
      mensajeWhatsapp: document.getElementById('f-mensaje-wa').value.trim(),
      banner: {
        titulo: document.getElementById('f-banner-titulo').value.trim(),
        subtitulo: document.getElementById('f-banner-subtitulo').value.trim(),
        textoBoton: document.getElementById('f-banner-boton').value.trim(),
        imagenUrl: bannerUrl,
      },
      tema: {
        colorPrimario: document.getElementById('f-color-1').value,
        colorSecundario: document.getElementById('f-color-2').value,
      },
      redes: {
        facebook: document.getElementById('f-facebook').value.trim(),
        instagram: document.getElementById('f-instagram').value.trim(),
        tiktok: document.getElementById('f-tiktok').value.trim(),
      },
      catalogo: {
        productosPorCategoriaHome: Math.max(3, Math.min(30, Number(document.getElementById('f-cat-cantidad').value) || 10)),
      },
      metodosPago: metodosPago.length ? metodosPago : ['Efectivo'],
    };

    try {
      p = await Api.put('/parametros', body);
      Toast.ok('Ajustes guardados. Ya están activos en el sitio público.');
    } catch (err) {
      Toast.error(err.message);
    }
  }

  function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escapeAttr(str) { return escapeHtml(str).replace(/"/g, '&quot;'); }

  return { render };
})();
