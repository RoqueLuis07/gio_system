const { createClient } = require('@supabase/supabase-js');

// Mapa camelCase (app) <-> snake_case (columnas Postgres) por tabla.
const TABLES = {
  usuarios: {
    columns: { id: 'id', nombre: 'nombre', pass: 'pass', rol: 'rol' },
  },
  productos: {
    columns: { id: 'id', nombre: 'nombre', precio: 'precio', meta: 'meta', valor: 'valor' },
    numeric: ['precio', 'meta', 'valor'],
  },
  ventas: {
    columns: {
      id: 'id', productoId: 'producto_id', cliente: 'cliente', telefono: 'telefono',
      empresa: 'empresa', cargo: 'cargo', metodoPago: 'metodo_pago', fecha: 'fecha',
      monto: 'monto', porcentaje: 'porcentaje', comision: 'comision',
    },
    numeric: ['monto', 'porcentaje', 'comision'],
  },
  prospectos: {
    columns: { id: 'id', nombre: 'nombre', productoId: 'producto_id', telefono: 'telefono', estado: 'estado', fecha: 'fecha' },
  },
  recordatorios: {
    columns: { id: 'id', titulo: 'titulo', fecha: 'fecha', cliente: 'cliente', completado: 'completado', comentario: 'comentario', imagen: 'imagen' },
  },
  plantillas: {
    columns: { id: 'id', titulo: 'titulo', cuerpo: 'cuerpo' },
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

async function getState() {
  const [usuarios, productos, ventas, prospectos, recordatorios, plantillas, parametros] = await Promise.all([
    getCollection('usuarios'),
    getCollection('productos'),
    getCollection('ventas'),
    getCollection('prospectos'),
    getCollection('recordatorios'),
    getCollection('plantillas'),
    getCollection('parametros'),
  ]);
  return { usuarios, productos, ventas, prospectos, recordatorios, plantillas, parametros };
}

module.exports = { getState, getCollection, setCollection };
