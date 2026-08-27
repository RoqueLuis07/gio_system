import { api } from '../api.js';
import { state } from '../state.js';
import { showToast } from '../toast.js';
import { renderAll } from '../render.js';

let modoActual = 'new';
let modoGrupoActual = 'new';
let miembrosSeleccionados = new Set();

function plantillasEmail() {
  return state.plantillas.filter((t) => t.canal === 'email');
}

function updatePreview() {
  const tplId = document.getElementById('em-plantilla-select').value;
  const nombre = document.getElementById('em-nombre').value.trim() || '[Nombre]';
  const diplomado = document.getElementById('em-diplomado').value.trim() || '[Diplomado]';

  const tpl = plantillasEmail().find((t) => t.id === tplId);
  if (tpl) {
    const cuerpo = tpl.cuerpo.replace(/{nombre}/g, nombre).replace(/{diplomado}/g, diplomado);
    const asunto = (tpl.asunto || '').replace(/{nombre}/g, nombre).replace(/{diplomado}/g, diplomado);
    document.getElementById('em-preview').value = cuerpo;
    document.getElementById('em-asunto').value = asunto;
  }
}

function syncTplModeSelect() {
  const modeSelect = document.getElementById('em-tpl-mode-select');
  modeSelect.innerHTML = '<option value="new">➕ Crear Nueva Plantilla</option>' +
    plantillasEmail().map((t) => `<option value="${t.id}">✏️ Editar: ${t.titulo}</option>`).join('');

  modeSelect.value = plantillasEmail().some((t) => t.id === modoActual) ? modoActual : 'new';
  modoActual = modeSelect.value;
}

function syncSelects() {
  const opciones = plantillasEmail().map((t) => `<option value="${t.id}">${t.titulo}</option>`).join('');
  const vacio = '<option value="">Todavía no hay plantillas de email</option>';
  document.getElementById('em-plantilla-select').innerHTML = opciones || vacio;
  document.getElementById('em-bulk-plantilla-select').innerHTML = opciones || vacio;
}

function syncDiplomadoSelect() {
  const sel = document.getElementById('em-bulk-diplomado-select');
  const pOptions = state.productos.map((p) => `<option value="${p.id}">${p.nombre}</option>`).join('');
  sel.innerHTML = '<option value="todos">Todos los Diplomados</option>' + pOptions;
}

function tamanoGrupo(grupo) {
  if (!grupo) return 0;
  const idsSet = new Set(grupo.ventaIds || []);
  const desdeClientes = state.ventas.filter((v) => idsSet.has(v.id) && v.email && v.email.trim()).length;
  const manuales = (grupo.emailsManuales || []).length;
  return desdeClientes + manuales;
}

function syncGrupoSelectBulk() {
  const sel = document.getElementById('em-bulk-grupo-select');
  sel.innerHTML = '<option value="">— Sin grupo (usar diplomado) —</option>' +
    state.gruposEnvio.map((g) => `<option value="${g.id}">${g.nombre} (${tamanoGrupo(g)})</option>`).join('');
}

function updateBulkCount() {
  const grupoId = document.getElementById('em-bulk-grupo-select').value;

  if (grupoId) {
    const grupo = state.gruposEnvio.find((g) => g.id === grupoId);
    document.getElementById('em-bulk-count-label').textContent = `${tamanoGrupo(grupo)} destinatario(s) con email en el grupo "${grupo ? grupo.nombre : ''}".`;
    return;
  }

  const productoId = document.getElementById('em-bulk-diplomado-select').value;
  let ventasFiltradas = state.ventas;
  if (productoId && productoId !== 'todos') ventasFiltradas = ventasFiltradas.filter((v) => v.productoId === productoId);

  const conEmail = ventasFiltradas.filter((v) => v.email && v.email.trim());
  document.getElementById('em-bulk-count-label').textContent = `${conEmail.length} alumno(s) con email registrado de ${ventasFiltradas.length} en ese filtro.`;
}

function parseCorreosManuales(texto) {
  return (texto || '')
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
}

function actualizarResumenGrupo() {
  const correos = parseCorreosManuales(document.getElementById('grupo-correos-manuales').value);
  const total = miembrosSeleccionados.size + correos.length;
  document.getElementById('grupo-resumen-label').textContent =
    `${miembrosSeleccionados.size} cliente(s) existente(s) + ${correos.length} correo(s) pegado(s) = ${total} destinatario(s) en total.`;
}

function syncGrupoModeSelect() {
  const modeSelect = document.getElementById('grupo-mode-select');
  modeSelect.innerHTML = '<option value="new">➕ Crear Nuevo Grupo</option>' +
    state.gruposEnvio.map((g) => `<option value="${g.id}">✏️ Editar: ${g.nombre}</option>`).join('');

  modeSelect.value = state.gruposEnvio.some((g) => g.id === modoGrupoActual) ? modoGrupoActual : 'new';
  modoGrupoActual = modeSelect.value;
}

function renderMiembrosLista() {
  const cont = document.getElementById('grupo-miembros-lista');
  const filtro = document.getElementById('grupo-buscar').value.trim().toLowerCase();
  const ventasFiltradas = state.ventas.filter((v) => !filtro || v.cliente.toLowerCase().includes(filtro));

  if (ventasFiltradas.length === 0) {
    cont.innerHTML = '<p style="font-size:0.8rem; color:var(--wa2-text-muted); margin:0;">Sin resultados.</p>';
    return;
  }

  cont.innerHTML = ventasFiltradas.map((v) => {
    const prod = state.productos.find((p) => p.id === v.productoId);
    const checked = miembrosSeleccionados.has(v.id) ? 'checked' : '';
    return `
      <label style="display:flex; align-items:center; gap:0.5rem; padding:0.35rem 0; font-size:0.85rem; cursor:pointer;">
        <input type="checkbox" data-venta-id="${v.id}" ${checked} />
        <span>${v.cliente}${v.email ? '' : ' ⚠️ sin email'} <span style="color:var(--wa2-text-muted);">— ${prod ? prod.nombre : ''}</span></span>
      </label>
    `;
  }).join('');
  actualizarResumenGrupo();
}

export function renderEmailModuloOptions() {
  syncSelects();
  syncDiplomadoSelect();
  syncGrupoSelectBulk();
  syncTplModeSelect();
  syncGrupoModeSelect();
  updatePreview();
  updateBulkCount();
  renderMiembrosLista();
}

function aplicarModoEditor() {
  const saveBtn = document.getElementById('em-tpl-save-btn');
  const deleteBtn = document.getElementById('em-tpl-delete-btn');
  const tituloInput = document.getElementById('em-tpl-titulo');
  const asuntoInput = document.getElementById('em-tpl-asunto');
  const cuerpoInput = document.getElementById('em-tpl-cuerpo');

  if (modoActual === 'new') {
    tituloInput.value = '';
    asuntoInput.value = '';
    cuerpoInput.value = '';
    saveBtn.textContent = 'Añadir Plantilla';
    saveBtn.className = 'btn secondary';
    deleteBtn.style.display = 'none';
  } else {
    const tpl = plantillasEmail().find((t) => t.id === modoActual);
    if (tpl) {
      tituloInput.value = tpl.titulo;
      asuntoInput.value = tpl.asunto || '';
      cuerpoInput.value = tpl.cuerpo;
      saveBtn.textContent = 'Guardar Cambios';
      saveBtn.className = 'btn gold';
      deleteBtn.style.display = 'inline-flex';
    }
  }
}

function aplicarModoGrupoEditor() {
  const saveBtn = document.getElementById('grupo-save-btn');
  const deleteBtn = document.getElementById('grupo-delete-btn');
  const nombreInput = document.getElementById('grupo-nombre');
  const correosInput = document.getElementById('grupo-correos-manuales');

  if (modoGrupoActual === 'new') {
    nombreInput.value = '';
    correosInput.value = '';
    miembrosSeleccionados = new Set();
    saveBtn.textContent = 'Añadir Grupo';
    saveBtn.className = 'btn secondary';
    deleteBtn.style.display = 'none';
  } else {
    const grupo = state.gruposEnvio.find((g) => g.id === modoGrupoActual);
    if (grupo) {
      nombreInput.value = grupo.nombre;
      correosInput.value = (grupo.emailsManuales || []).join('\n');
      miembrosSeleccionados = new Set(grupo.ventaIds || []);
      saveBtn.textContent = 'Guardar Cambios';
      saveBtn.className = 'btn gold';
      deleteBtn.style.display = 'inline-flex';
    }
  }
  renderMiembrosLista();
}

export function initEmailModulo() {
  ['em-nombre', 'em-diplomado', 'em-plantilla-select'].forEach((id) => {
    document.getElementById(id).addEventListener('input', updatePreview);
    document.getElementById(id).addEventListener('change', updatePreview);
  });

  document.getElementById('em-bulk-diplomado-select').addEventListener('change', updateBulkCount);
  document.getElementById('em-bulk-grupo-select').addEventListener('change', updateBulkCount);

  document.getElementById('grupo-buscar').addEventListener('input', renderMiembrosLista);

  document.getElementById('grupo-miembros-lista').addEventListener('change', (e) => {
    const chk = e.target.closest('input[type="checkbox"][data-venta-id]');
    if (!chk) return;
    if (chk.checked) miembrosSeleccionados.add(chk.dataset.ventaId);
    else miembrosSeleccionados.delete(chk.dataset.ventaId);
    actualizarResumenGrupo();
  });

  document.getElementById('grupo-correos-manuales').addEventListener('input', actualizarResumenGrupo);

  document.getElementById('grupo-mode-select').addEventListener('change', (e) => {
    modoGrupoActual = e.target.value;
    aplicarModoGrupoEditor();
  });

  document.getElementById('grupo-save-btn').addEventListener('click', async () => {
    const nombre = document.getElementById('grupo-nombre').value.trim();
    if (!nombre) return alert('Ingresa un nombre para el grupo.');
    const ventaIds = Array.from(miembrosSeleccionados);
    const emailsManuales = parseCorreosManuales(document.getElementById('grupo-correos-manuales').value);

    if (ventaIds.length === 0 && emailsManuales.length === 0) {
      return alert('Selecciona al menos un cliente existente o pega al menos un correo válido.');
    }

    try {
      if (modoGrupoActual === 'new') {
        const nuevo = await api.gruposEnvio.create({ nombre, ventaIds, emailsManuales });
        state.gruposEnvio.push(nuevo);
        showToast('Grupo creado');
      } else {
        const actualizado = await api.gruposEnvio.update(modoGrupoActual, { nombre, ventaIds, emailsManuales });
        const g = state.gruposEnvio.find((x) => x.id === modoGrupoActual);
        if (g) Object.assign(g, actualizado);
        showToast('Grupo actualizado');
      }
      modoGrupoActual = 'new';
      await renderAll();
      aplicarModoGrupoEditor();
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('grupo-delete-btn').addEventListener('click', async () => {
    if (modoGrupoActual === 'new' || !confirm('¿Eliminar este grupo?')) return;
    try {
      await api.gruposEnvio.remove(modoGrupoActual);
      state.gruposEnvio = state.gruposEnvio.filter((g) => g.id !== modoGrupoActual);
      modoGrupoActual = 'new';
      showToast('Grupo eliminado');
      await renderAll();
      aplicarModoGrupoEditor();
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('em-tpl-mode-select').addEventListener('change', (e) => {
    modoActual = e.target.value;
    aplicarModoEditor();
  });

  document.getElementById('em-tpl-save-btn').addEventListener('click', async () => {
    const titulo = document.getElementById('em-tpl-titulo').value.trim();
    const asunto = document.getElementById('em-tpl-asunto').value.trim();
    const cuerpo = document.getElementById('em-tpl-cuerpo').value.trim();

    if (!titulo || !asunto || !cuerpo) return alert('Ingresa título, asunto y cuerpo del correo.');

    try {
      if (modoActual === 'new') {
        const nueva = await api.plantillas.create({ titulo, cuerpo, asunto, canal: 'email' });
        state.plantillas.push(nueva);
        showToast('Nueva plantilla de email creada');
      } else {
        const actualizada = await api.plantillas.update(modoActual, { titulo, cuerpo, asunto, canal: 'email' });
        const tpl = state.plantillas.find((t) => t.id === modoActual);
        if (tpl) Object.assign(tpl, actualizada);
        showToast('Plantilla actualizada');
      }

      modoActual = 'new';
      await renderAll();
      aplicarModoEditor();
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('em-tpl-delete-btn').addEventListener('click', async () => {
    if (modoActual === 'new' || !confirm('¿Deseas eliminar esta plantilla?')) return;

    try {
      await api.plantillas.remove(modoActual);
      state.plantillas = state.plantillas.filter((t) => t.id !== modoActual);
      modoActual = 'new';
      showToast('Plantilla eliminada');
      await renderAll();
      aplicarModoEditor();
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('em-send-btn').addEventListener('click', async () => {
    const to = document.getElementById('em-to').value.trim();
    const subject = document.getElementById('em-asunto').value.trim();
    const cuerpo = document.getElementById('em-preview').value;

    if (!to) return alert('Ingresa el email del destinatario.');
    if (!subject) return alert('Ingresa el asunto del correo.');

    const btn = document.getElementById('em-send-btn');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    try {
      await api.email.send({ to, subject, cuerpo });
      showToast('Correo enviado correctamente.');
    } catch (err) {
      alert(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '📧 Enviar Correo';
    }
  });

  document.getElementById('em-bulk-send-btn').addEventListener('click', async () => {
    const plantillaId = document.getElementById('em-bulk-plantilla-select').value;
    const productoId = document.getElementById('em-bulk-diplomado-select').value;
    const grupoId = document.getElementById('em-bulk-grupo-select').value;
    const countLabel = document.getElementById('em-bulk-count-label').textContent;

    if (!plantillaId) return alert('Selecciona una plantilla de email.');
    if (!confirm(`Se enviará el correo a todos los alumnos con email (${countLabel}). ¿Continuar?`)) return;

    const btn = document.getElementById('em-bulk-send-btn');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    document.getElementById('em-bulk-result').textContent = '';
    try {
      const resultado = await api.email.bulkSend({ plantillaId, productoId, grupoId: grupoId || undefined });
      const resumen = `✅ ${resultado.enviados} enviados` + (resultado.fallidos.length ? ` · ⚠️ ${resultado.fallidos.length} fallidos` : '');
      document.getElementById('em-bulk-result').textContent = resumen;
      showToast('Envío masivo completado: ' + resumen);
    } catch (err) {
      alert(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '📧 Enviar a Todos';
    }
  });

  aplicarModoEditor();
  aplicarModoGrupoEditor();
}
