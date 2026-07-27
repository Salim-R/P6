require('dotenv').config();

const http = require('http');
const app = require('./app');
const connectDatabase = require('./config/database');

const normalizePort = (value) => {
  const port = parseInt(value, 10);

  if (Number.isNaN(port)) {
    return value;
  }
  return port >= 0 ? port : false;
};

// Le port par defaut manquait : sans variable PORT, le serveur ecoutait sur
// une valeur undefined.
const port = normalizePort(process.env.PORT || 3000);
app.set('port', port);

const server = http.createServer(app);

server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `pipe ${port}` : `port ${port}`;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} necessite des privileges eleves.`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} est deja utilise.`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

server.on('listening', () => {
  console.log(`API en ecoute sur le port ${port}`);
});

// On attend la base avant d'accepter des requetes : inutile de repondre a des
// clients si la persistance n'est pas disponible.
connectDatabase()
  .then(() => server.listen(port))
  .catch((error) => {
    console.error('Demarrage impossible :', error.message);
    process.exit(1);
  });
