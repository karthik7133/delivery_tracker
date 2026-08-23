# 🚚 Delivery Tracker

A full-stack last-mile delivery management system built for Tier-2 Indian cities (Guntur, Vijayawada).

## Features

- **Customer Portal** — Browse products, cart checkout, address management, real-time order tracking
- **Agent Dashboard** — Zone-based order claiming, status updates, delivery proof photo upload
- **Admin Panel** — Order management, agent management, rate card configuration, zone management
- **Smart Zone Routing** — 180+ pincodes across Guntur & Vijayawada zones via pincodeapi.in
- **Dynamic Pricing** — 32 rate cards covering B2C/B2B × INTRA/INTER × 8 weight slabs (0–100kg)
- **Real-time Tracking** — Live transit simulation with status timeline

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Framer Motion |
| Backend | Node.js, Express.js (ESM) |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT |
| File Upload | Cloudinary |
| Email | Nodemailer + Gmail SMTP |
| Styling | Vanilla CSS (glassmorphism dark theme) |

## Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/karthik7133/delivery_tracker.git
cd delivery_tracker
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env
# Fill in your credentials in .env
npm install
npm run dev
```

### 3. Frontend setup
```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

## Environment Variables

See [`backend/.env.example`](./backend/.env.example) for all required backend variables.

## Project Structure

```
delivery_tracker/
├── backend/
│   ├── src/
│   │   ├── config/         # DB, Cloudinary config
│   │   ├── middleware/      # Auth, error handling, validation
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express route handlers
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helpers
│   │   └── validators/      # Input validation
│   └── scripts/             # DB seed & maintenance scripts
└── frontend/
    └── src/
        ├── api/             # Axios API clients
        ├── components/      # Reusable UI components
        ├── context/         # React Context (cart, auth)
        ├── pages/           # Route pages (customer/agent/admin)
        ├── types/           # TypeScript interfaces
        └── utils/           # Shared utilities
```

## Default Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@deliverytracker.com | Admin@123 |
| Agent | ravi@deliverytracker.com | Agent@123 |
| Customer | karthik@swiftkart.com | Customer@123 |
