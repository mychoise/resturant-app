# Restaurant Backend

NestJS backend for a restaurant POS/kitchen workflow. It handles authentication, menu-driven order creation, table occupancy, role-based access, Socket.IO live updates, and BullMQ alerts for long-pending orders.

## What it does

- **Authentication** with JWT stored in an HTTP-only cookie
- **Role-based access** for `waiter`, `kitchen`, and `admin`
- **Menu and order management** backed by Drizzle ORM + PostgreSQL
- **Table tracking** with occupancy status
- **Real-time order updates** over Socket.IO
- **Queued alerts** with BullMQ + Redis for pending orders
- **Global validation and error handling** for consistent API responses

## Tech stack

- NestJS
- Drizzle ORM
- PostgreSQL
- JWT + Passport
- bcrypt
- Socket.IO
- BullMQ
- Redis

## Project structure

| Path | Purpose |
| --- | --- |
| `src/auth` | Register/login, JWT strategy, guards, and role decorators |
| `src/order` | Order REST API, Socket.IO gateway, queue processor, business logic |
| `src/table` | Table listing and occupancy updates |
| `src/drizzle/schema` | Database schema definitions |
| `seed/` | Seed scripts for menu items and dining tables |
| `common/filters` | Global exception filter |

## Features

### Authentication

- Register a new user
- Login with email/password
- JWT is issued and stored in a cookie named `token`
- `/auth/profile` returns the authenticated user
- `/auth/waiter` demonstrates role-protected access

### Roles

Supported roles:

- `waiter`
- `kitchen`
- `admin`

### Orders

- Create a new order from menu items
- Append items to an existing order
- Fetch all recent orders
- Update item status: `pending`, `preparing`, `ready`, `served`
- Automatically mark the table occupied when an order is created
- Recalculate order totals from menu snapshots

### Tables

- List all dining tables
- Update table occupancy

### Realtime workflow

- Authenticate Socket.IO clients with the JWT cookie
- Auto-join `waiters` or `kitchen` rooms based on role
- Join table-specific rooms
- Broadcast new orders and status changes in real time

### Alerting

- BullMQ job checks pending orders
- If an order remains pending, a kitchen alert is emitted
- Queue uses Redis on `localhost:6379` in the current code

## Database model

### `user`

- `id`
- `name`
- `email`
- `password`
- `role`
- `performance_score`
- `is_active`
- timestamps

### `menu_category`

- `id`
- `name`
- `is_active`
- timestamps

### `menu_item`

- `id`
- `category_id`
- `name`
- `description`
- `price`
- `is_available`
- timestamps

### `diningTable`

- `id`
- `table_number`
- `is_occupied`
- `updated_at`

### `order`

- `id`
- `table_id`
- `status`
- `total_price`
- `is_paid`
- `payment_method`
- timestamps

### `order-item`

- `id`
- `order_id`
- `menu_item_id`
- `order_taken_by`
- `item_name`
- `status`
- `price_snapshot`
- `quantity`
- `subtotal`
- `created_at`

## API

### Health

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | No | Returns `Hello World!` |

### Auth

| Method | Route | Auth | Body |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | No | `name`, `email`, `password`, `role` |
| `POST` | `/auth/login` | No | `email`, `password` |
| `GET` | `/auth/profile` | Yes | - |
| `GET` | `/auth/waiter` | Yes + role | - |

### Tables

| Method | Route | Auth | Body |
| --- | --- | --- | --- |
| `GET` | `/table/all` | Yes | - |
| `POST` | `/table/change-status` | Yes | `tableId`, `is_occupied` |

### Orders

| Method | Route | Auth | Body |
| --- | --- | --- | --- |
| `POST` | `/order/create` | Yes | `table_id`, `items[]` |
| `GET` | `/order/all` | Yes | - |
| `POST` | `/order/update/:order_id` | Yes | `table_id`, `items[]` |
| `POST` | `/order/status/:order_item_id` | Yes | `status` |

## Order payloads

### Create order

```json
{
  "table_id": "uuid",
  "items": [
    {
      "menu_item_id": "uuid",
      "item_name": "Spring Rolls",
      "quantity": 2
    }
  ]
}
```

### Append to existing order

Use the same payload as create order with `POST /order/update/:order_id`.

### Update item status

```json
{
  "status": "ready"
}
```

## Socket.IO events

### Client to server

- `join:table`
- `order:new`
- `order:update`
- `order:served`
- `order:addToPrevious`

### Server to client

- `joined:table`
- `order:created`
- `order:new`
- `order:update`
- `order:served`
- `order:alert`

## Environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgres://user:password@localhost:5432/restaurant
JWT_SECRET=your_jwt_secret
SALT_ROUNDS=10
PORT=3000
NODE_ENV=development
```

### Notes

- Redis is currently hardcoded to `localhost:6379` for BullMQ.
- The frontend origin is currently set to `http://localhost:5173`.

## Setup

```bash
npm install
```

## Run locally

```bash
npm run start:dev
```

## Build

```bash
npm run build
```

## Tests

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Database and seeding

This project uses Drizzle ORM. The schema lives in `src/drizzle/schema`.

### Seed tables

```bash
npx ts-node seed/table.seed.ts
```

### Seed menu

```bash
npx ts-node seed/menu.seed.ts
```

If you generate migrations with Drizzle Kit, the config is in `drizzle.config.ts`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run start` | Start the app once |
| `npm run start:dev` | Start in watch mode |
| `npm run start:debug` | Start with debugger attached |
| `npm run start:prod` | Run the compiled app |
| `npm run build` | Compile TypeScript |
| `npm run lint` | Run ESLint with autofix |
| `npm run format` | Format source files |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Generate coverage report |

## Response format

Errors are returned through a global exception filter in a consistent shape:

```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2026-06-23T00:00:00.000Z",
  "path": "/route",
  "message": "Error message"
}
```

## Important behavior

- Cookies are required for authenticated HTTP and Socket.IO requests.
- Order creation snapshots item names and prices at the time of purchase.
- Table occupancy is updated automatically when an order is created.
- Pending orders trigger queue-based alerts for the kitchen.

