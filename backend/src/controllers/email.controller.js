const storage = require('../services/storage.service');
const emailService = require('../services/email.service');

async function enviarUno(req, res) {
  try {
    const to = (req.body.to || '').trim();
    const subject = (req.body.subject || '').trim();
    const cuerpo = (req.body.cuerpo || '').trim();
    if (!to || !subject || !cuerpo) {
      return res.status(400).json({ error: 'Faltan datos: destinatario, asunto o mensaje.' });
    }

    await emailService.sendEmail({ to, subject, cuerpo });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function enviarMasivo(req, res) {
  try {
    const plantillaId = req.body.plantillaId;
    const productoId = req.body.productoId;
    const grupoId = req.body.grupoId;
    const asuntoOverride = (req.body.asunto || '').trim();
    if (!plantillaId) return res.status(400).json({ error: 'Selecciona una plantilla.' });

    const [plantillas, ventas, productos, grupos] = await Promise.all([
      storage.getCollection('plantillas'),
      storage.getCollection('ventas'),
      storage.getCollection('productos'),
      storage.getCollection('grupos_envio'),
    ]);

    const plantilla = plantillas.find((p) => p.id === plantillaId);
    if (!plantilla) return res.status(404).json({ error: 'Plantilla no encontrada.' });

    const asuntoBase = asuntoOverride || plantilla.asunto || '';
    if (!asuntoBase) return res.status(400).json({ error: 'La plantilla no tiene asunto y no se indicó uno.' });

    let destinatarios;
    if (grupoId) {
      const grupo = grupos.find((g) => g.id === grupoId);
      if (!grupo) return res.status(404).json({ error: 'Grupo no encontrado.' });
      const idsSet = new Set(grupo.ventaIds || []);
      const desdeClientes = ventas.filter((v) => idsSet.has(v.id));
      const desdeManuales = (grupo.emailsManuales || []).map((email) => ({ cliente: '', email, productoId: null }));
      destinatarios = [...desdeClientes, ...desdeManuales];
    } else if (productoId && productoId !== 'todos') {
      destinatarios = ventas.filter((v) => v.productoId === productoId);
    } else {
      destinatarios = ventas;
    }

    destinatarios = destinatarios.filter((v) => v.email && v.email.trim());

    // Evita enviar dos veces al mismo correo (ej. si un cliente aparece seleccionado
    // y también fue pegado manualmente).
    const emailsVistos = new Set();
    destinatarios = destinatarios.filter((v) => {
      const email = v.email.trim().toLowerCase();
      if (emailsVistos.has(email)) return false;
      emailsVistos.add(email);
      return true;
    });

    if (destinatarios.length === 0) {
      return res.status(400).json({ error: 'No hay alumnos con email registrado para ese filtro.' });
    }

    const resultado = { enviados: 0, fallidos: [] };
    for (const venta of destinatarios) {
      const producto = productos.find((p) => p.id === venta.productoId);
      const vars = { nombre: venta.cliente, diplomado: producto ? producto.nombre : '' };
      const cuerpo = emailService.renderTemplate(plantilla.cuerpo, vars);
      const subject = emailService.renderTemplate(asuntoBase, vars);

      try {
        await emailService.sendEmail({ to: venta.email, subject, cuerpo });
        resultado.enviados += 1;
      } catch (err) {
        resultado.fallidos.push({ email: venta.email, error: err.message });
      }

      // Evita saturar el límite de envíos por segundo del servidor SMTP.
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { enviarUno, enviarMasivo };
