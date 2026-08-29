require('dotenv').config();
const createApp = require('./src/app');
const { ensureAdmin } = require('./src/services/bootstrap.service');

const PORT = process.env.PORT || 4100;

async function main() {
  await ensureAdmin();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Jair Comercial escuchando en http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Error al iniciar el servidor:', err.message);
  process.exit(1);
});
