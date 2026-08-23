# Delivery Tracker Backend

A modular monolith backend for a package delivery tracking system built with Node.js, Express, and MongoDB.

## Features

- **Authentication** with JWT and role-based access (Customer, Agent, Admin)
- **Zone Engine** — pincode-based zone detection for pickup and drop locations
- **Pricing Engine** — volumetric weight, chargeable weight, B2B/B2C rate cards, intra/inter-zone pricing, COD surcharge
- **Order Engine** — quote before confirmation, server-side price recalculation on order creation
- **Agent Assignment Engine** — manual and automatic assignment using nearest-agent GPS (Haversine) with same-zone fallback
- **Tracking Engine** — immutable tracking history with validated status transitions
- **Failed Delivery & Reschedule** — customer reschedule with automatic agent reassignment
- **Notifications** — email (Nodemailer) and SMS on every status change (non-blocking)
- **Admin Management** — zone CRUD, rate card CRUD, order filtering, agent management, status override
- **Cloudinary** — proof-of-delivery image upload

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT + bcryptjs
- Nodemailer (email), pluggable SMS provider
- Cloudinary (media storage)
- Helmet, CORS, express-rate-limit

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then edit .env with your credentials
npm run seed            # seed admin, agent, customer, zones, rate cards
npm run dev             # start dev server
```

## Environment Variables

See `.env.example` for all required variables:

- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — secret for signing JWTs
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`
- `SMS_API_KEY` — your SMS provider key (stubs if unset)
- `SEED_ADMIN_*` — admin seed credentials

## Seeded Accounts

| Role    | Email                      | Password     |
|---------|----------------------------|--------------|
| Admin   | admin@deliverytracker.com  | Admin@123    |
| Agent   | ravi@deliverytracker.com   | Agent@123    |
| Customer| karthik@gmail.com          | Customer@123 |

## API Map

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

### Customer
```
POST   /api/orders/quote
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
GET    /api/orders/:id/tracking
POST   /api/orders/:id/reschedule
```

### Agent
```
GET    /api/agent/orders
GET    /api/agent/orders/:id
PATCH  /api/agent/location
PATCH  /api/agent/status
PATCH  /api/agent/orders/:id/status
POST   /api/agent/orders/:id/proof   (multipart file upload)
```

### Admin
```
GET    /api/admin/orders
GET    /api/admin/orders/:id
POST   /api/admin/orders/:id/assign
POST   /api/admin/orders/:id/auto-assign
PATCH  /api/admin/orders/:id/status

GET    /api/admin/agents
GET    /api/admin/agents/:id
PATCH  /api/admin/agents/:id/status

GET    /api/admin/customers

POST   /api/admin/zones
GET    /api/admin/zones
GET    /api/admin/zones/:id
PUT    /api/admin/zones/:id
DELETE /api/admin/zones/:id
POST   /api/admin/zones/:id/areas
DELETE /api/admin/zones/:id/areas/:area

POST   /api/admin/rate-cards
GET    /api/admin/rate-cards
GET    /api/admin/rate-cards/:id
PUT    /api/admin/rate-cards/:id
DELETE /api/admin/rate-cards/:id
```

## Pricing Pipeline

```
Quote request
  -> detect pickup zone (by pincode)
  -> detect drop zone (by pincode)
  -> determine INTRA_ZONE or INTER_ZONE
  -> volumetric weight = L x B x H / 5000
  -> chargeable weight = max(actual, volumetric)
  -> find matching rate card (orderType + rateType + weight range)
  -> base charge = baseCharge + ratePerKg x chargeableWeight
  -> COD surcharge (from rate card, 0 if PREPAID)
  -> total = base + COD surcharge
```

## Status Lifecycle

```
CREATED -> ASSIGNED -> PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED
                                                    |
                                                    +-> FAILED -> (reschedule) -> ASSIGNED
```

All transitions are validated. Tracking history is append-only and immutable.

## Architecture

```
Controller -> Service -> Model
```

Business logic lives in services. Controllers handle HTTP. Models define schema.
