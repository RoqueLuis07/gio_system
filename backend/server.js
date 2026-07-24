require('dotenv').config();
const createApp = require('./src/app');

const PORT = process.env.PORT || 4000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`GM Ventas Pro backend escuchando en http://localhost:${PORT}`);
});
