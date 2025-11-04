# hotel-api

API REST construida con Node.js y Express para gestionar habitaciones y reservaciones de un hotel. Expone endpoints para CRUD de habitaciones, búsquedas avanzadas, vistas de disponibilidad y administración de reservaciones, controlando el acceso mediante CORS con una lista blanca de orígenes.

## Características principales

- Gestión de habitaciones (`/api/rooms`): listar, buscar, consultar y administrar disponibilidad de habitaciones en MongoDB.
- Gestión de reservaciones (`/api/reservations`): crear reservaciones, actualizar su estado, filtrar por criterios y consultar disponibilidad en rangos personalizados.
- Gestión de huéspedes (`/api/guests`): registro básico con paginación, filtros y administración de información de contacto y documentos.
- Administración de pagos (`/api/payments`): registrar abonos, calcular saldos pendientes y listar el historial de pagos.
- Conexión a MongoDB usando Mongoose con soporte para variables de entorno.
- Middleware CORS configurado con lista de orígenes permitidos y soporte para credenciales.

## Requisitos previos

- Node.js 18+ (se recomienda la versión LTS vigente).
- Servidor MongoDB accesible (local o Atlas).

## Configuración del proyecto

1. Clona el repositorio y entra a la carpeta del proyecto.
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` en la raíz con las variables necesarias:
   ```env
   MONGO_URI=mongodb+srv://usuario:password@cluster-url/basedatos
   PORT=3000
   ```
4. Inicia el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
   Para producción utiliza `npm start`.

## Endpoints principales

### Habitaciones (`/api/rooms`)

- `GET /api/rooms` — Lista todas las habitaciones ordenadas por número.
- `GET /api/rooms/search` — Búsqueda filtrada y ordenada por tipo, capacidad, precio, amenidades y disponibilidad.
- `GET /api/rooms/:id` — Obtiene el detalle de una habitación específica.
- `POST /api/rooms` — Crea una nueva habitación.
- `PUT /api/rooms/:id` — Actualiza una habitación existente.
- `PATCH /api/rooms/:id/availability` — Cambia el estado de disponibilidad de una habitación.
- `DELETE /api/rooms/:id` — Elimina una habitación.

### Reservaciones (`/api/reservations`)

- `GET /api/reservations` — Lista reservaciones con filtros por estado, habitación, email del huésped y rango de fechas.
- `GET /api/reservations/:id` — Obtiene el detalle de una reservación.
- `GET /api/reservations/rooms/available` — Devuelve habitaciones disponibles y reservadas en un rango de fechas.
- `GET /api/reservations/rooms/overview` — Resumen de habitaciones con reservaciones próximas.
- `GET /api/reservations/rooms/:roomNumber/reservations` — Lista reservaciones por habitación con opción de mostrar solo futuras.
- `POST /api/reservations` — Crea una reservación calculando precio total, validando traslape de fechas y vinculando (o creando) un huésped.
- `PATCH /api/reservations/:id/status` — Actualiza el estado de una reservación.

### Huéspedes (`/api/guests`)

- `GET /api/guests` — Lista huéspedes con paginación, búsqueda y filtros por tipo de documento.
- `GET /api/guests/:id` — Obtiene la información de un huésped específico.
- `POST /api/guests` — Registra un nuevo huésped validando correo único.
- `PUT /api/guests/:id` — Actualiza los datos de un huésped existente.
- `DELETE /api/guests/:id` — Elimina un huésped.

### Pagos (`/api/payments`)

- `GET /api/payments` — Lista pagos con filtros por reservación, huésped, método y rango de fechas.
- `GET /api/payments/:id` — Obtiene el detalle de un pago.
- `GET /api/payments/reservation/:reservationId` — Historial de pagos de una reservación.
- `POST /api/payments` — Registra un pago aplicando métodos permitidos (efectivo, tdd, tdc) y actualiza el saldo pendiente.

### Reportes (`/api/reports`)

- `GET /api/reports/monthly` — Reporte mensual de ocupación, ingresos por habitación y tasa de cancelaciones. Parámetros opcionales `year` y `month` (1-12).

## Scripts disponibles

- `npm run dev` — Ejecuta el servidor con `nodemon` para recarga en caliente.
- `npm start` — Ejecuta el servidor con Node.js en modo producción.
