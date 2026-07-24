require('dotenv').config();
const createApp = require('./src/app');
const { ensureSuperadmin } = require('./src/services/bootstrap.service');

const PORT = process.env.PORT || 4000;

ensureSuperadmin();
const app = createApp();

app.listen(PORT, () => {
  console.log(`GM Ventas Pro backend escuchando en http://localhost:${PORT}`);
});
