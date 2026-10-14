const assert = require('node:assert/strict');
const test = require('node:test');
const database = require('../src/database');

let databaseUnavailable = false;
let lastFilter;
let lastFindOptions;
let lastSort;
let lastSkip;
let lastLimit;

const clients = [
  {
    id: 'CLI001',
    nombre: 'Lucía Fernández',
    email: 'lucia.fernandez@example.com',
    ciudad: 'Bahía Blanca',
    provincia: 'Buenos Aires',
    fechaAlta: '2025-03-12'
  },
  {
    id: 'CLI002',
    nombre: 'Ana Pérez',
    email: 'ana.perez@example.com',
    ciudad: 'Bahía Blanca',
    provincia: 'Buenos Aires',
    fechaAlta: '2025-03-13'
  }
];

database.getMongoClient = () => ({
  db: () => ({
    admin: () => ({
      ping: async () => {
        if (databaseUnavailable) throw new Error('database unavailable');
      }
    })
  })
});

database.getCollection = () => ({
  find(filter, options) {
    lastFilter = filter;
    lastFindOptions = options;
    return {
      sort(value) {
        lastSort = value;
        return this;
      },
      skip(value) {
        lastSkip = value;
        return this;
      },
      limit(value) {
        lastLimit = value;
        return this;
      },
      toArray: async () => clients
    };
  },
  countDocuments: async (filter) => {
    assert.equal(filter, lastFilter);
    return 5;
  },
  findOne: async () => null
});

const app = require('../src/app');
let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test('health returns the contract shape and 503 when MongoDB ping fails', async () => {
  let response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'ok',
    service: 'grupo-03-clientes',
    collection: 'clientes',
    version: '1.0.0'
  });

  databaseUnavailable = true;
  response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: 'service_unavailable',
    message: 'La base de datos no está disponible.'
  });
  databaseUnavailable = false;
});

test('list applies exact case-insensitive filters, sorting, and pagination', async () => {
  const response = await fetch(
    `${baseUrl}/items?ciudad=Bah%C3%ADa%20Blanca&provincia=BUENOS%20AIRES&limit=2&offset=1`
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    items: clients,
    total: 5,
    limit: 2,
    offset: 1
  });
  assert.equal(lastFilter.ciudad.test('bahía blanca'), true);
  assert.equal(lastFilter.ciudad.test('Bahía Blanca Oeste'), false);
  assert.equal(lastFilter.provincia.test('Buenos Aires'), true);
  assert.deepEqual(lastSort, { id: 1 });
  assert.equal(lastSkip, 1);
  assert.equal(lastLimit, 2);
  assert.equal(lastFindOptions.projection._id, 0);
});

test('invalid query values and missing ids use the common error shape', async () => {
  let response = await fetch(`${baseUrl}/items?limit=101`);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'bad_request',
    message: 'El parámetro limit debe estar entre 1 y 100.'
  });

  response = await fetch(`${baseUrl}/items?ciudad=a&ciudad=b`);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'bad_request');

  response = await fetch(`${baseUrl}/items/CLI999`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    error: 'not_found',
    message: 'No existe CLI999.'
  });
});
