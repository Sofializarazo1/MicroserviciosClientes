const assert = require('node:assert/strict');
const test = require('node:test');
const { BadRequestError, parseListQuery } = require('../src/query');
const { COLLECTION_NAME } = require('../src/database');

test('uses the collection name declared in the OpenAPI contract', () => {
  assert.equal(COLLECTION_NAME, 'clientes');
});

test('uses the contract pagination defaults', () => {
  assert.deepEqual(parseListQuery({}), {
    filter: {},
    limit: 20,
    offset: 0
  });
});

test('parses pagination and exact case-insensitive filters', () => {
  const result = parseListQuery({
    ciudad: 'Bahía Blanca',
    provincia: 'Buenos Aires',
    limit: '10',
    offset: '20'
  });

  assert.equal(result.limit, 10);
  assert.equal(result.offset, 20);
  assert.equal(result.filter.ciudad.test('bahía blanca'), true);
  assert.equal(result.filter.ciudad.test('Bahía Blanca Oeste'), false);
  assert.equal(result.filter.provincia.test('BUENOS AIRES'), true);
});

test('escapes regular-expression characters in filters', () => {
  const { filter } = parseListQuery({ ciudad: 'A.*' });
  assert.equal(filter.ciudad.test('A.*'), true);
  assert.equal(filter.ciudad.test('Anything'), false);
});

test('rejects invalid pagination with a bad-request error', () => {
  for (const query of [
    { limit: '0' },
    { limit: '101' },
    { limit: '1.5' },
    { offset: '-1' },
    { offset: '9007199254740992' }
  ]) {
    assert.throws(() => parseListQuery(query), BadRequestError);
  }
});

test('rejects non-string filters', () => {
  assert.throws(() => parseListQuery({ ciudad: ['Rosario'] }), BadRequestError);
});
