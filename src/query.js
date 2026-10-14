class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BadRequestError';
    this.status = 400;
    this.code = 'bad_request';
  }
}

function parseInteger(value, name, minimum, maximum) {
  if (typeof value !== 'string' || !/^-?\d+$/.test(value)) {
    throw new BadRequestError(`El parámetro ${name} debe ser un número entero.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || (maximum !== undefined && parsed > maximum)) {
    const range = maximum === undefined
      ? `ser mayor o igual a ${minimum}`
      : `estar entre ${minimum} y ${maximum}`;
    throw new BadRequestError(`El parámetro ${name} debe ${range}.`);
  }

  return parsed;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseListQuery(query) {
  const limit = query.limit === undefined
    ? 20
    : parseInteger(query.limit, 'limit', 1, 100);
  const offset = query.offset === undefined
    ? 0
    : parseInteger(query.offset, 'offset', 0);
  const filter = {};

  for (const field of ['ciudad', 'provincia']) {
    const value = query[field];
    if (value !== undefined) {
      if (typeof value !== 'string') {
        throw new BadRequestError(`El parámetro ${field} debe ser un texto.`);
      }
      filter[field] = new RegExp(`^${escapeRegex(value)}$`, 'i');
    }
  }

  return { filter, limit, offset };
}

module.exports = { BadRequestError, parseListQuery };
