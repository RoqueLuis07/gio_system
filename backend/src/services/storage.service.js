const { createClient } = require('@supabase/supabase-js');

// Mapa camelCase (app) <-> snake_case (columnas Postgres) por tabla.
const TABLES = {
  usuarios: {
    columns: { id: 'id', nombre: 'nombre', pass: 'pass', rol: 'rol', fotoUrl: 'foto_url' },
  },
  productos: {
    columns: {
      id: 'id', nombre: 'nombre', precio: 'precio', meta: 'meta', valor: 'valor', estado: 'estado',
      fotoUrl: 'foto_url', docentes: 'docentes', descripcionPromo: 'descripcion_promo', publicado: 'publicado',
      perfilIngreso: 'perfil_ingreso', perfilEgreso: 'perfil_egreso', beneficios: 'beneficios',
      brochurePdfUrl: 'brochure_pdf_url', precioOferta: 'precio_oferta',
    },
    numeric: ['precio', 'meta', 'valor', 'precioOferta'],
  },
  ventas: {
    columns: {
      id: 'id', productoId: 'producto_id', cliente: 'cliente', telefono: 'telefono', ci: 'ci', email: 'email',
      empresa: 'empresa', cargo: 'cargo', metodoPago: 'metodo_pago', fecha: 'fecha',
      monto: 'monto', porcentaje: 'porcentaje', comision: 'comision', descuento: 'descuento', cobrado: 'cobrado',
    },
    numeric: ['monto', 'porcentaje', 'comision', 'descuento'],
  },
  prospectos: {
    columns: { id: 'id', nombre: 'nombre', productoId: 'producto_id', telefono: 'telefono', estado: 'estado', fecha: 'fecha' },
  },
  recordatorios: {
    columns: { id: 'id', titulo: 'titulo', fecha: 'fecha', cliente: 'cliente', completado: 'completado', comentario: 'comentario', imagen: 'imagen' },
  },
  plantillas: {
    columns: { id: 'id', titulo: 'titulo', cuerpo: 'cuerpo', canal: 'canal', asunto: 'asunto' },
  },
  enlaces: {
    columns: { id: 'id', titulo: 'titulo', url: 'url' },
  },
  grupos_envio: {
    columns: { id: 'id', nombre: 'nombre', ventaIds: 'venta_ids', emailsManuales: 'emails_manuales' },
  },
};

let client = null;

function getClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Faltan las variables de entorno SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.');
  }

  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

function toDbRow(table, appObj) {
  const { columns } = TABLES[table];
  const row = {};
  for (const [appKey, dbKey] of Object.entries(columns)) {
    if (appObj[appKey] !== undefined) row[dbKey] = appObj[appKey];
  }
  return row;
}

function fromDbRow(table, dbRow) {
  const { columns, numeric = [] } = TABLES[table];
  const obj = {};
  for (const [appKey, dbKey] of Object.entries(columns)) {
    let value = dbRow[dbKey];
    if (numeric.includes(appKey) && value !== null && value !== undefined) value = Number(value);
    obj[appKey] = value;
  }
  return obj;
}

async function getParametros() {
  const { data, error } = await getClient().from('parametros').select('*').eq('id', 1).single();
  if (error) throw new Error(`Error leyendo parametros: ${error.message}`);
  return {
    metodosPago: data.metodos_pago || [],
    cargos: data.cargos || [],
    moneda: data.moneda || '₲',
  };
}

async function setParametros(patch) {
  const { data, error } = await getClient()
    .from('parametros')
    .update({ metodos_pago: patch.metodosPago, cargos: patch.cargos })
    .eq('id', 1)
    .select()
    .single();
  if (error) throw new Error(`Error guardando parametros: ${error.message}`);
  return { metodosPago: data.metodos_pago, cargos: data.cargos, moneda: data.moneda };
}

async function getCollection(name) {
  if (name === 'parametros') return getParametros();

  const { data, error } = await getClient().from(name).select('*').order('created_at', { ascending: true });
  if (error) throw new Error(`Error leyendo ${name}: ${error.message}`);
  return data.map((row) => fromDbRow(name, row));
}

// Reemplaza la colección completa por el array dado: hace upsert de cada fila
// (por id) e inserta/actualiza en una sola operación, y borra las filas que
// ya no están presentes en `items`. Evita el patrón "borrar todo + reinsertar"
// para no dejar la tabla vacía si algo falla a mitad de camino.
async function setCollection(name, items) {
  if (name === 'parametros') return setParametros(items);

  const supabase = getClient();
  const nextIds = new Set(items.map((item) => item.id));

  const { data: existing, error: selectError } = await supabase.from(name).select('id');
  if (selectError) throw new Error(`Error leyendo ${name}: ${selectError.message}`);

  const idsToDelete = existing.map((row) => row.id).filter((id) => !nextIds.has(id));
  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase.from(name).delete().in('id', idsToDelete);
    if (deleteError) throw new Error(`Error eliminando registros de ${name}: ${deleteError.message}`);
  }

  if (items.length > 0) {
    const rows = items.map((item) => toDbRow(name, item));
    const { error: upsertError } = await supabase.from(name).upsert(rows, { onConflict: 'id' });
    if (upsertError) throw new Error(`Error guardando ${name}: ${upsertError.message}`);
  }

  return items;
}

const ARCHIVOS_BUCKET = 'repositorio';

async function listArchivos() {
  const { data, error } = await getClient().from('archivos').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(`Error leyendo archivos: ${error.message}`);
  return data.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    categoria: row.categoria,
    tipo: row.tipo,
    url: row.url,
    tamano: Number(row.tamano) || 0,
    fecha: row.created_at,
  }));
}

async function insertArchivo({ id, nombre, categoria, tipo, buffer }) {
  await ensureBucket(ARCHIVOS_BUCKET);
  const supabase = getClient();
  const ruta = `${id}-${nombre}`;

  const { error: uploadError } = await supabase.storage.from(ARCHIVOS_BUCKET).upload(ruta, buffer, {
    contentType: tipo || 'application/octet-stream',
    upsert: false,
  });
  if (uploadError) throw new Error(`Error subiendo el archivo: ${uploadError.message}`);

  const { data: urlData } = supabase.storage.from(ARCHIVOS_BUCKET).getPublicUrl(ruta);

  const { data, error } = await supabase
    .from('archivos')
    .insert({ id, nombre, categoria, tipo, ruta, url: urlData.publicUrl, tamano: buffer.length })
    .select()
    .single();
  if (error) throw new Error(`Error guardando el archivo: ${error.message}`);

  return { id: data.id, nombre: data.nombre, categoria: data.categoria, tipo: data.tipo, url: data.url, tamano: Number(data.tamano) || 0, fecha: data.created_at };
}

async function renameArchivo(id, nombre) {
  const { data, error } = await getClient().from('archivos').update({ nombre }).eq('id', id).select().single();
  if (error) throw new Error(`Error renombrando el archivo: ${error.message}`);
  if (!data) return null;
  return { id: data.id, nombre: data.nombre, categoria: data.categoria, tipo: data.tipo, url: data.url, tamano: Number(data.tamano) || 0, fecha: data.created_at };
}

async function removeArchivo(id) {
  const supabase = getClient();
  const { data: row, error: selectError } = await supabase.from('archivos').select('ruta').eq('id', id).single();
  if (selectError) throw new Error(`Error leyendo el archivo: ${selectError.message}`);
  if (!row) return false;

  const { error: storageError } = await supabase.storage.from(ARCHIVOS_BUCKET).remove([row.ruta]);
  if (storageError) throw new Error(`Error eliminando el archivo del storage: ${storageError.message}`);

  const { error: deleteError } = await supabase.from('archivos').delete().eq('id', id);
  if (deleteError) throw new Error(`Error eliminando el archivo: ${deleteError.message}`);

  return true;
}

const bucketsListos = new Set();

async function ensureBucket(nombre) {
  if (bucketsListos.has(nombre)) return;
  const supabase = getClient();

  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`Error listando buckets de storage: ${error.message}`);

  const existe = (buckets || []).some((b) => b.name === nombre);
  if (!existe) {
    const { error: createError } = await supabase.storage.createBucket(nombre, { public: true });
    if (createError) throw new Error(`Error creando el bucket ${nombre}: ${createError.message}`);
  }
  bucketsListos.add(nombre);
}

async function subirArchivoPublico(bucket, ruta, buffer, tipo) {
  await ensureBucket(bucket);
  const supabase = getClient();

  const { error: uploadError } = await supabase.storage.from(bucket).upload(ruta, buffer, {
    contentType: tipo || 'application/octet-stream',
    upsert: true,
  });
  if (uploadError) throw new Error(`Error subiendo el archivo: ${uploadError.message}`);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(ruta);
  return urlData.publicUrl;
}

async function subirAvatar({ userId, buffer, tipo }) {
  return subirArchivoPublico('avatars', `${userId}-${Date.now()}`, buffer, tipo);
}

async function subirFotoDiplomado({ productoId, buffer, tipo }) {
  return subirArchivoPublico('diplomados', `${productoId}-foto-${Date.now()}`, buffer, tipo);
}

async function subirBrochureDiplomado({ productoId, buffer, tipo }) {
  return subirArchivoPublico('diplomados', `${productoId}-brochure-${Date.now()}.pdf`, buffer, tipo);
}

async function getState() {
  const [usuarios, productos, ventas, prospectos, recordatorios, plantillas, parametros, archivos, enlaces, gruposEnvio] = await Promise.all([
    getCollection('usuarios'),
    getCollection('productos'),
    getCollection('ventas'),
    getCollection('prospectos'),
    getCollection('recordatorios'),
    getCollection('plantillas'),
    getCollection('parametros'),
    listArchivos(),
    getCollection('enlaces'),
    // La tabla grupos_envio es opcional/nueva: si todavía no se corrió la migración
    // que la crea, no debe tumbar la carga de todo el resto del estado.
    getCollection('grupos_envio').catch(() => []),
  ]);
  return { usuarios, productos, ventas, prospectos, recordatorios, plantillas, parametros, archivos, enlaces, gruposEnvio };
}

module.exports = { getState, getCollection, setCollection, listArchivos, insertArchivo, renameArchivo, removeArchivo, subirAvatar, subirFotoDiplomado, subirBrochureDiplomado };
