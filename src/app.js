const cors = require('cors');
const express = require('express');
const { getCollection, getMongoClient } = require('./database');
const { BadRequestError, parseListQuery } = require('./query');

const app = express();
app.disable('x-powered-by');
app.use(cors());

const itemProjection = {
  _id: 0,
  id: 1,
  nombre: 1,
  email: 1,
  ciudad: 1,
  provincia: 1,
  fechaAlta: 1
};

app.get('/health', async (req, res) => {
  try {
    await getMongoClient().db().admin().ping();
    return res.json({
      status: 'ok',
      service: 'grupo-03-clientes',
      collection: 'clientes',
      version: '1.0.0'
    });
  } catch (error) {
    console.error('No se pudo verificar la conexión con MongoDB:', error);
    return res.status(503).json({
      error: 'service_unavailable',
      message: 'La base de datos no está disponible.'
    });
  }
});

app.get('/items', async (req, res, next) => {
  let options;
  try {
    options = parseListQuery(req.query);
  } catch (error) {
    if (error instanceof BadRequestError) {
      return res.status(400).json({ error: error.code, message: error.message });
    }
    return next(error);
  }

  try {
    const collection = getCollection();
    const [items, total] = await Promise.all([
      collection.find(options.filter, { projection: itemProjection })
        .sort({ id: 1 })
        .skip(options.offset)
        .limit(options.limit)
        .toArray(),
      collection.countDocuments(options.filter)
    ]);

    return res.json({
      items,
      total,
      limit: options.limit,
      offset: options.offset
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/items/:id', async (req, res, next) => {
  try {
    const item = await getCollection().findOne(
      { id: req.params.id },
      { projection: itemProjection }
    );

    if (!item) {
      return res.status(404).json({
        error: 'not_found',
        message: `No existe ${req.params.id}.`
      });
    }

    return res.json(item);
  } catch (error) {
    return next(error);
  }
});

app.use((req, res) => {
  return res.status(404).json({
    error: 'not_found',
    message: 'No existe la ruta solicitada.'
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  console.error('Error no controlado en la API:', error);
  return res.status(500).json({
    error: 'internal_error',
    message: 'Ocurrió un error interno.'
  });
});

module.exports = app;
