require('dotenv').config();

const app = require('./app');
const { closeMongoConnection } = require('./database');

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, () => {
  console.log(`Microservicio de clientes escuchando en el puerto ${port}.`);
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Señal ${signal} recibida; cerrando el servicio.`);

  server.close(async (error) => {
    if (error) {
      console.error('Error al cerrar el servidor HTTP:', error);
      process.exitCode = 1;
    }

    try {
      await closeMongoConnection();
    } catch (closeError) {
      console.error('Error al cerrar la conexión con MongoDB:', closeError);
      process.exitCode = 1;
    }
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
