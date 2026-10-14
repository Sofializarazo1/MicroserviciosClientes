# Microservicio de clientes

Servicio HTTP de solo lectura basado en Express y MongoDB Atlas. Su contrato OpenAPI 3.0.3 está en [`openapi.yaml`](./openapi.yaml).

## Requisitos

- Node.js 20 o superior
- Una base de datos MongoDB Atlas accesible desde el entorno donde se ejecuta el servicio

## Configuración y ejecución

1. Instala dependencias con `npm install`.
2. Copia `.env.example` a `.env` y completa `MONGO_URI` con la URI de MongoDB Atlas. No publiques el archivo `.env`.
3. Ejecuta `npm start` (o `npm run dev` durante el desarrollo).

`DB_NAME` usa `DBClientes` de forma predeterminada y `PORT` usa `3000`. La colección consultada en Atlas es `Clientes`; el contrato publica `collection: "clientes"` en la respuesta de salud.

## Endpoints

- `GET /health`: responde `200` cuando MongoDB está operativo y `503` cuando no lo está.
- `GET /items?ciudad=Rosario&provincia=Santa%20Fe&limit=20&offset=0`: combina filtros exactos sin distinguir mayúsculas, ordena por `id` ascendente y devuelve el total antes de paginar.
- `GET /items/CLI001`: devuelve el cliente con ese `id` o responde `404`.

La paginación predeterminada es `limit=20` y `offset=0`. `limit` debe ser un entero de 1 a 100; `offset`, un entero no negativo. Los errores usan `{ "error": "<codigo>", "message": "<detalle>" }`.

Los documentos deben tener `id`, `nombre`, `email`, `ciudad`, `provincia` y `fechaAlta`, con los nombres de campo definidos en la semilla. La API no crea ni modifica datos.

## Pruebas

Ejecuta `npm test`.
