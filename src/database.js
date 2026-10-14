const { MongoClient } = require('mongodb');

const COLLECTION_NAME = 'Clientes';

let client;

function getMongoClient() {
  if (!client) {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('Falta configurar la variable MONGO_URI.');
    }

    client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
  }
  return client;
}

function getDatabase() {
  const dbName = process.env.DB_NAME || 'DBClientes';
  return getMongoClient().db(dbName);
}

function getCollection() {
  return getDatabase().collection(COLLECTION_NAME);
}

async function closeMongoConnection() {
  if (client) {
    const currentClient = client;
    client = undefined;
    await currentClient.close();
  }
}

module.exports = {
  COLLECTION_NAME,
  closeMongoConnection,
  getCollection,
  getDatabase,
  getMongoClient
};
