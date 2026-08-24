# 🚚 Delivery Tracker — Full-Stack Last-Mile Logistics Platform

> A production-grade last-mile delivery management system built for Tier-2 Indian cities (Guntur & Vijayawada). Covers the entire delivery lifecycle — from customer order placement to agent proof-of-delivery upload — with real-time tracking, dynamic pricing, and zone-based routing.

---

## 🌐 Live Demo

**🔗 Frontend:** [https://deliverytracker7733.netlify.app](https://deliverytracker7733.netlify.app)

---

## 🔗 Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| 👑 Admin | `admin@deliverytracker.com` | `Admin@123` | Full system control |
| 🛵 Agent | `ravi@deliverytracker.com` | `Agent@123` | Agent dashboard |
| 🛒 Customer | `karthik@swiftkart.com` | `Customer@123` | Shopping & tracking |

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Architecture](#-system-architecture)
3. [Tech Stack](#-tech-stack)
4. [Features](#-features)
5. [User Flows](#-user-flows)
   - [Customer Flow](#-customer-flow)
   - [Agent Flow](#-agent-flow)
   - [Admin Flow](#-admin-flow)
6. [API Reference](#-api-reference)
7. [Data Models](#-data-models)
8. [Algorithms & Services](#-algorithms--services)
9. [Zone Coverage & Pricing](#-zone-coverage--pricing)
10. [Setup & Installation](#-setup--installation)
11. [Environment Variables](#-environment-variables)
12. [Project Structure](#-project-structure)

---

## 🎯 Project Overview

**Delivery Tracker** is a full-stack logistics SaaS platform that manages last-mile delivery for small businesses in Tier-2 Indian cities. It provides:

- An **e-commerce storefront** for customers to place orders with real-time deliverability checking
- A **mobile-first agent dashboard** for delivery agents to claim, manage, and proof deliveries
- A **comprehensive admin panel** to manage the entire logistics operation
- **Dynamic pricing** using a rate card system (weight-based slabs × zone type × order type)
- **Real-time order tracking** with a status timeline and transit simulation

The system handles the full B2C delivery lifecycle:
```
Customer places order → Admin reviews → Agent assigned to zone → 
Agent claims order → Picks up → In Transit → Out for Delivery → 
Delivers with photo proof → Order DELIVERED
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Customer UI │  │  Agent UI    │  │  Admin UI             │  │
│  │  (shopping)  │  │  (delivery)  │  │  (management panel)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         └─────────────────┴──────────────────────┘              │
│                         Axios HTTP Client                        │
│                   (JWT auth + interceptors)                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST API (JSON)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                   │
│                                                                  │
│   Auth     Orders    Agents    Admin    Zones    Upload           │
│   Routes   Routes    Routes    Routes   Routes   Routes           │
│     │         │         │        │        │         │            │
│     └─────────┴─────────┴────────┴────────┴─────────┘            │
│                         Service Layer                            │
│  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │  Pricing │ │  Zone   │ │Tracking  │ │  Transit Simulator │  │
│  │  Service │ │ Service │ │ Service  │ │  (auto status flow)│  │
│  └──────────┘ └─────────┘ └──────────┘ └────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
              ┌────────────────┴─────────────────┐
              │                                  │
              ▼                                  ▼
   ┌─────────────────────┐           ┌──────────────────────┐
   │   MongoDB Atlas      │           │  External Services   │
   │   (Mongoose ODM)     │           │  • Cloudinary (imgs) │
   │   • Users            │           │  • Brevo HTTP API    │
   │   • Orders           │           │    (primary email)   │
   │   • Agents           │           │  • Nodemailer SMTP   │
   │   • Zones            │           │    (email fallback)  │
   │   • RateCards        │           │  • PincodeAPI.in     │
   │   • TrackingHistory  │           │    (zone lookup)     │
   └─────────────────────┘           └──────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 5 | Build tool & dev server |
| React Router v6 | 6 | Client-side routing |
| Framer Motion | — | Animations & transitions |
| Axios | — | HTTP client with interceptors |
| React Hot Toast | — | Toast notifications |
| Lucide React | — | Icon library |
| React Dropzone | — | Drag-and-drop file upload |
| Vanilla CSS | — | Glassmorphism dark theme |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 22 (ESM) | Runtime |
| Express.js | 4 | Web framework |
| Mongoose | 8 | MongoDB ODM |
| JWT | — | Stateless authentication |
| Multer | — | Multipart file upload middleware |
| express-validator | — | Request body validation |
| Nodemailer | — | Email delivery (Gmail SMTP / fallback) |
| node-fetch (built-in) | — | Brevo HTTP API calls (Port 443) |
| Cloudinary SDK | — | Image storage & CDN |
| bcryptjs | — | Password hashing |
| express-rate-limit | — | API rate limiting (300 req/15min) |
| Helmet | — | HTTP security headers |
| CORS | — | Cross-Origin Resource Sharing |

### Infrastructure & External APIs
| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Cloud database |
| Cloudinary | Delivery proof photo storage |
| Brevo (Sendinblue) | Primary email provider — HTTP API (Port 443, 300 free emails/day, zero Render timeouts) |
| Gmail SMTP (App Password) | Secondary email fallback (Nodemailer, Ports 465/587) |
| Resend API | Final fallback email provider |
| pincodeapi.in | Live pincode → district mapping for zone routing |

---

## ✨ Features

### 🛒 Customer Portal
- **E-Commerce Storefront** — Product catalogue with categories, search, and product detail modal
- **Shopping Cart** — Add/remove items, quantity controls, real-time subtotal
- **Pincode Deliverability Check** — Live API check before placing order (zone-aware)
- **Smart Checkout** — Address management (add/edit/delete), payment method selection
- **COD & Prepaid** — Cash on Delivery and simulated online card payment
- **Promo Code** — Apply `SWIFT10` for 10% discount
- **Order Tracking** — Full timeline view with status badges and tracking history
- **Profile Management** — Saved addresses, order history

### 🛵 Agent Dashboard
- **Zone Selection** — Agent picks their service zone (Guntur / Vijayawada) at login
- **Zone-Filtered Orders** — Only sees orders whose drop pincode falls in their selected zone
- **Order Claiming** — One-click claim of available orders (first-come first-served)
- **Status Updates** — Moves order through: OUT_FOR_DELIVERY → DELIVERED / FAILED
- **Proof of Delivery Upload** — Drag-and-drop photo upload (Cloudinary / base64 fallback)
- **Customer Contact** — Full customer name, email, phone visible on claimed orders

### 👑 Admin Panel
- **Live Dashboard** — Order counts by status, revenue, active agents
- **Order Management** — View, filter, manually update any order's status
- **Agent Management** — View all agents, their status, zone, and assigned orders
- **Customer Management** — View all registered customers
- **Rate Card Config** — View all 32 rate cards (B2C/B2B × INTRA/INTER × 8 weight slabs)
- **Zone Management** — View zones and their pincode coverage

### 🔐 Authentication
- **JWT-based** stateless auth (7-day expiry)
- **Role-based access control** — CUSTOMER, AGENT, ADMIN roles enforced on every route
- **Email OTP** verification on registration (Brevo HTTP API → Gmail SMTP fallback → Resend fallback)
- **Auto-logout** on 401 with redirect to landing page
- **Password hashing** with bcrypt (salt rounds: 12)

---

## 👤 User Flows

### 🛒 Customer Flow

```
1. LANDING PAGE
   └─ Login / Register (Email OTP verification)

2. E-COMMERCE HOME
   ├─ Browse products by category
   ├─ Search products
   ├─ View product detail modal (price, weight, dimensions)
   └─ Add to Cart (quantity selector)

3. SHOPPING CART & CHECKOUT (/customer/cart)
   ├─ Review cart items (name, qty, price)
   ├─ Add / Edit / Delete delivery address
   │   └─ Enter: Full name, address, city, pincode, phone
   ├─ Select delivery address
   │   └─ Auto-checks: "Is this pincode deliverable?"
   │       ├─ ✅ Green: "Delivery available in Guntur Zone"
   │       ├─ 🔵 Blue: "Agent will be assigned before pickup"
   │       └─ 🔴 Red: "Sorry, we don't deliver to this pincode yet"
   ├─ Apply Promo Code (SWIFT10 = 10% off)
   ├─ Choose Payment: COD or Prepaid Card
   └─ Place Order
       ├─ COD → Order created immediately
       └─ Prepaid → Card modal → Enter card details → Order created

4. ORDER CONFIRMATION
   └─ Success screen with Order ID, total, estimated delivery

5. ORDER TRACKING (/customer/orders/:id)
   ├─ Live status timeline
   ├─ Current status badge
   ├─ Package details (weight, dimensions)
   ├─ Pickup & drop addresses
   └─ Pricing breakdown
```

---

### 🛵 Agent Flow

```
1. LOGIN
   └─ Enter credentials → JWT issued

2. ZONE SELECTION (first-time / changeable)
   ├─ View available zones (Guntur Zone, Vijayawada Zone)
   ├─ Each zone shows covered areas & pincode count
   └─ Select zone → Saved to agent profile in DB

3. STATUS TOGGLE
   └─ Toggle: OFFLINE ↔ AVAILABLE
       └─ AVAILABLE → Orders with drop zone = agent's zone appear

4. AGENT DASHBOARD (/agent)
   ├─ "Available Orders" tab — Orders IN_TRANSIT with drop in agent's zone
   │   ├─ View order card: customer name, pickup, drop, items
   │   └─ Click "Claim Order" → Order assigned, status → OUT_FOR_DELIVERY
   └─ "My Orders" tab — All orders ever assigned to this agent

5. ORDER DETAIL PAGE (/agent/orders/:id)
   ├─ Full order info: items, addresses, customer contact
   ├─ Customer phone number (for coordination)
   ├─ Update Status: OUT_FOR_DELIVERY → DELIVERED or FAILED
   ├─ Add note (e.g. "Customer not home")
   └─ Upload Proof of Delivery
       ├─ Drag-and-drop or click to select image
       ├─ Preview before upload
       └─ Uploads to Cloudinary → URL saved to order
```

---

### 👑 Admin Flow

```
1. LOGIN → Admin panel (/admin)

2. DASHBOARD
   ├─ Total orders, pending, in-transit, delivered counts
   ├─ Revenue overview
   └─ Active agents count

3. ORDER MANAGEMENT (/admin/orders)
   ├─ List all orders with filters (status, date)
   ├─ Click order → Full detail view
   │   ├─ Customer contact info
   │   ├─ Package specs
   │   ├─ Pricing breakdown (base + per-kg + COD surcharge)
   │   ├─ Tracking history timeline
   │   └─ Manually update order status

4. AGENT MANAGEMENT (/admin/agents)
   ├─ All agents: name, phone, vehicle, status, zone
   └─ Click agent → Orders assigned to them

5. RATE CARDS (/admin/rate-cards)
   └─ View all 32 rate cards:
       B2C INTRA | B2C INTER | B2B INTRA | B2B INTER
       × 8 weight slabs each (0–0.5, 0.5–1, 1–2, 2–5, 5–10, 10–20, 20–50, 50–100 kg)

6. ZONE MANAGEMENT (/admin/zones)
   └─ View Guntur Zone (109 pincodes) and Vijayawada Zone (87 pincodes)
```

---

## 📡 API Reference

### Auth (`/api/auth`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register new user, sends OTP |
| POST | `/verify-otp` | Public | Verify email OTP |
| POST | `/login` | Public | Login, returns JWT |
| GET | `/me` | Auth | Get current user profile |

### Orders (`/api/orders`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/check-pincode?pincode=522001` | Auth | Check deliverability + agent availability |
| POST | `/quote` | Auth | Get price quote for a package |
| POST | `/` | Customer | Place new order |
| GET | `/` | Customer | List own orders |
| GET | `/:id` | Customer | Get order with tracking history |

### Agent (`/api/agent`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/profile` | Agent | Get agent profile + zone |
| GET | `/status` | Agent | Get current status (AVAILABLE/OFFLINE/BUSY) |
| PATCH | `/status` | Agent | Update status |
| PATCH | `/zone` | Agent | Select/change service zone |
| GET | `/zones` | Agent | List all active zones |
| GET | `/orders` | Agent | List all assigned orders |
| GET | `/orders/claimable` | Agent | Orders available to claim in agent's zone |
| GET | `/orders/:id` | Agent | Get single assigned order |
| PATCH | `/orders/:id/status` | Agent | Update order status |
| POST | `/orders/:id/claim` | Agent | Claim an order |
| POST | `/orders/:id/proof` | Agent | Upload delivery proof photo |

### Admin (`/api/admin`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/orders` | Admin | All orders (paginated, filterable) |
| GET | `/orders/:id` | Admin | Single order full detail |
| PATCH | `/orders/:id/status` | Admin | Override order status |
| GET | `/agents` | Admin | All agents |
| GET | `/customers` | Admin | All customers |
| GET | `/stats` | Admin | Dashboard stats |

### Tracking (`/api`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/track/:orderId` | Public | Public tracking page by Order ID string |

---

## 🗄️ Data Models

### User
```js
{
  name: String,
  email: String (unique),
  phone: String,
  password: String (bcrypt hashed),
  role: enum['CUSTOMER', 'AGENT', 'ADMIN'],
  isVerified: Boolean,
  createdAt, updatedAt
}
```

### Order
```js
{
  orderId: String,            // e.g. "ORD-12345"
  customerId: ObjectId → User,
  pickup: { address, city, pincode, zoneId },
  drop:   { address, city, pincode, zoneId },
  package: {
    length, breadth, height,  // cm
    actualWeight,             // kg
    volumetricWeight,         // (L×B×H)/5000
    chargeableWeight          // max(actual, volumetric)
  },
  items: [{ productId, name, image, price, quantity, category }],
  orderImage: String,
  orderType: enum['B2C', 'B2B'],
  paymentType: enum['PREPAID', 'COD'],
  status: enum['CREATED','ASSIGNED','PICKED_UP','IN_TRANSIT',
               'OUT_FOR_DELIVERY','DELIVERED','FAILED','CANCELLED'],
  pricing: {
    baseCharge, codSurcharge, totalCharge, rateCardId
  },
  assignment: { agentId, assignedAt, assignmentType },
  proofUrl: String,           // Cloudinary URL or base64
  createdAt, updatedAt
}
```

### Agent
```js
{
  userId: ObjectId → User,
  phone: String,
  vehicleType: enum['BIKE','VAN','TRUCK'],
  status: enum['AVAILABLE','BUSY','OFFLINE'],
  currentLocation: { latitude, longitude },
  currentZoneId: ObjectId → Zone,
  assignedOrders: [ObjectId → Order],
  createdAt, updatedAt
}
```

### Zone
```js
{
  name: String,               // "Guntur Zone"
  code: String,               // "GNT"
  pincodes: [String],         // 109 pincodes for GNT
  areas: [String],            // ["Guntur", "Tenali", "Bapatla", ...]
  isActive: Boolean,
  createdAt, updatedAt
}
```

### RateCard
```js
{
  orderType: enum['B2C', 'B2B'],
  rateType: enum['INTRA_ZONE', 'INTER_ZONE'],
  minWeight: Number,          // kg (inclusive)
  maxWeight: Number,          // kg (exclusive — half-open interval)
  baseCharge: Number,         // ₹ fixed charge
  ratePerKg: Number,          // ₹ per kg
  codSurcharge: Number,       // ₹ extra for COD orders
  isActive: Boolean
}
```

### TrackingHistory
```js
{
  orderId: ObjectId → Order,
  status: OrderStatus,
  timestamp: Date,
  note: String,
  actorId: ObjectId → User,
  actorRole: enum['CUSTOMER','AGENT','ADMIN','SYSTEM']
}
```

---

## ⚙️ Algorithms & Services

### 1. Pricing Engine (`pricing.service.js`)

**Volumetric Weight Formula (standard logistics industry):**
```
Volumetric Weight (kg) = (Length × Breadth × Height) / 5000
Chargeable Weight = MAX(Actual Weight, Volumetric Weight)
```

**Rate Card Lookup — Half-Open Interval Query:**
```js
// Standard half-open interval: [minWeight, maxWeight)
// Weight 1.0 kg → matches 1–2 kg slab, NOT 0.5–1 kg slab
RateCard.findOne({
  orderType, rateType: zoneType,
  minWeight: { $lte: chargeableWeight },
  maxWeight: { $gt: chargeableWeight },
  isActive: true
})
// Fallback $gte for exactly 100kg (last slab boundary)
```

**Total Price Calculation:**
```
Base Charge = rateCard.baseCharge + (rateCard.ratePerKg × chargeableWeight)
COD Surcharge = rateCard.codSurcharge (if paymentType === 'COD')
Total = Base Charge + COD Surcharge
```

---

### 2. Zone Detection Service (`zone.service.js`)

```
1. Receive pickup pincode + drop pincode
2. Query Zone collection: Zone.findOne({ pincodes: pincode, isActive: true })
3. If pickup.zone === drop.zone → INTRA_ZONE
4. If pickup.zone !== drop.zone → INTER_ZONE
5. If either zone not found → throw AppError 400
```

**Pincode Coverage:**
- Guntur Zone (GNT): **109 pincodes** (Guntur + Bapatla districts, sourced from pincodeapi.in)
- Vijayawada Zone (VJA): **87 pincodes** (Krishna district + core 520xxx city pincodes)
- Data fetched via `GET https://api.pincodeapi.in/api/v1/district/{slug}` with full pagination

---

### 3. Deliverability Check (`order.service.js → checkPincodeDeliverability`)

```
Step 1: Find Zone for pincode → if not found: { deliverable: false }
Step 2: Find AVAILABLE agent in that zone (advisory only)
Step 3: Return:
  { deliverable: true, zone, agentAvailable: true/false, message }

Key design: Agent availability is NEVER a hard block.
Zone existence is the only hard block.
→ Prevents "ghost deliverability" where a pincode shows deliverable
  but order is rejected at placement.
```

---

### 4. Transit Simulator (`transit.simulator.js`)

Auto-advances order status on a time schedule after creation (development mode):
```
CREATED → (delay) → ASSIGNED → PICKED_UP → IN_TRANSIT → [agent claims] → OUT_FOR_DELIVERY
```
Each transition appends a TrackingHistory entry with `actorRole: 'SYSTEM'`.

---

### 5. Upload Service (`upload.routes.js` + `cloudinaryUpload.js`)

```
1. Multer: receives multipart/form-data, stores in memory (max 10MB, images only)
2. Agent authorization check:
   - Agent must be assigned to order, OR order in delivery status
3. Cloudinary upload:
   - Sends buffer via upload_stream
   - If Cloudinary fails → fallback to base64 data URL
4. Saves proofUrl to order document
```

**Content-Type fix (frontend):**
```js
// Uses transformRequest to delete Content-Type before send
// Lets browser/axios auto-set: multipart/form-data; boundary=<uuid>
transformRequest: [(data, headers) => {
  delete headers['Content-Type'];
  return data;
}]
```

---

### 6. Auth Service (`auth.service.js`)

```
REGISTER:
1. Check email not already registered
2. Hash password (bcrypt, 12 rounds)
3. Create user (isVerified: false)
4. Generate 6-digit OTP → save to Otp collection (5 min TTL)
5. Send OTP email via 3-tier email service:
   a. Brevo HTTP API (Port 443) — primary, 0% timeout on Render
   b. Nodemailer SMTP (Port 465/587 with auto-retry) — fallback
   c. Resend API — last resort

VERIFY OTP:
1. Find OTP by email + code
2. Check not expired
3. Mark user.isVerified = true
4. Delete OTP document (one-time use)

LOGIN:
1. Find user by email
2. bcrypt.compare password
3. Check isVerified
4. Sign JWT { userId, role } → 7 day expiry
```

---

## 💰 Zone Coverage & Pricing

### Zones

| Zone | Code | Districts Covered | Pincodes |
|------|------|-------------------|----------|
| Guntur Zone | GNT | Guntur + Bapatla | **109** |
| Vijayawada Zone | VJA | Krishna (core city) | **87** |

### Rate Cards (B2C)

#### INTRA_ZONE (within same zone, e.g. Guntur → Guntur)
| Weight Slab | Base Charge | Per Kg | COD Surcharge | Example (0.8kg) |
|-------------|-------------|--------|---------------|-----------------|
| 0 – 0.5 kg | ₹30 | ₹10 | ₹25 | ₹38 |
| 0.5 – 1 kg | ₹35 | ₹10 | ₹25 | ₹43 |
| 1 – 2 kg | ₹45 | ₹12 | ₹30 | ₹57 (1kg) |
| 2 – 5 kg | ₹60 | ₹15 | ₹35 | ₹90 (2kg) |
| 5 – 10 kg | ₹90 | ₹18 | ₹40 | ₹180 (5kg) |
| 10 – 20 kg | ₹150 | ₹20 | ₹50 | ₹350 (10kg) |
| 20 – 50 kg | ₹250 | ₹22 | ₹60 | ₹690 (20kg) |
| 50 – 100 kg | ₹500 | ₹25 | ₹80 | ₹1750 (50kg) |

#### INTER_ZONE (cross-zone, e.g. Guntur → Vijayawada)
| Weight Slab | Base Charge | Per Kg | COD Surcharge |
|-------------|-------------|--------|---------------|
| 0 – 0.5 kg | ₹45 | ₹15 | ₹30 |
| 0.5 – 1 kg | ₹55 | ₹15 | ₹30 |
| 1 – 2 kg | ₹70 | ₹18 | ₹35 |
| 2 – 5 kg | ₹100 | ₹20 | ₹40 |
| 5 – 10 kg | ₹160 | ₹22 | ₹50 |
| 10 – 20 kg | ₹250 | ₹25 | ₹60 |
| 20 – 50 kg | ₹400 | ₹28 | ₹75 |
| 50 – 100 kg | ₹700 | ₹30 | ₹100 |

> B2B rates are higher (no COD surcharge). See all 32 cards in the Admin → Rate Cards panel.

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+ (ESM support)
- MongoDB Atlas account
- Cloudinary account (free tier works)
- Gmail account with App Password enabled

### 1. Clone
```bash
git clone https://github.com/karthik7133/delivery_tracker.git
cd delivery_tracker
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
node src/scripts/seed.js   # Seeds admin user + zones + demo data
npm run dev                # Starts on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                # Starts on http://localhost:5173
```

### 4. Seed Rate Cards (required for pricing to work)
```bash
cd backend
node --env-file=.env scripts/seed-rate-cards.js
```

### 5. (Optional) Update Zone Pincodes from live API
```bash
node --env-file=.env scripts/update-zone-pincodes.js
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/delivery_tracker

JWT_SECRET=your_random_secret_key
JWT_EXPIRES_IN=7d

# Admin seed account (created on first run of seed.js)
SEED_ADMIN_EMAIL=admin@deliverytracker.com
SEED_ADMIN_PASSWORD=Admin@123
SEED_ADMIN_PHONE=9000000000

# Email — Option A: Brevo HTTP API (RECOMMENDED for Render deployment)
# 300 free emails/day, zero SMTP port-blocking timeouts on cloud platforms
# Get API Key (starts with xkeysib-) at: https://app.brevo.com/settings/keys/api
BREVO_API_KEY=xkeysib-your_api_key_here

# Email — Option B: Gmail SMTP via Nodemailer (fallback, may timeout on Render free tier)
# Use an App Password — NOT your real Gmail password
# Enable at: https://myaccount.google.com/apppasswords
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=yourname@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM=SwiftKart <yourname@gmail.com>

# Email — Option C: Resend API (last-resort fallback, requires custom domain for prod)
RESEND_API_KEY=re_your_key_here
RESEND_FROM=SwiftKart <onboarding@resend.dev>

# Cloudinary (proof photo uploads)
# Get credentials at: https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Email Priority Order**: The service checks `BREVO_API_KEY` → `EMAIL_USER + EMAIL_PASSWORD` (Nodemailer) → `RESEND_API_KEY`. Only one needs to be set.

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📁 Project Structure

```
delivery_tracker/
│
├── backend/
│   ├── server.js                    # Entry point
│   ├── src/
│   │   ├── app.js                   # Express app setup, route mounting
│   │   ├── config/
│   │   │   ├── db.js                # MongoDB connection
│   │   │   ├── cloudinary.js        # Cloudinary SDK config
│   │   │   └── mail.js              # Nodemailer transporter
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # JWT verify + requireRole()
│   │   │   ├── error.middleware.js  # Global error handler + AppError class
│   │   │   └── validation.middleware.js  # express-validator runner
│   │   ├── models/
│   │   │   ├── User.js              # Customer / Agent / Admin schema
│   │   │   ├── Order.js             # Full order lifecycle schema
│   │   │   ├── Agent.js             # Agent profile + zone assignment
│   │   │   ├── Zone.js              # Zone + pincodes array
│   │   │   ├── RateCard.js          # Weight-based pricing slabs
│   │   │   ├── TrackingHistory.js   # Per-status-change audit log
│   │   │   ├── Otp.js               # Email OTP (10 min TTL)
│   │   │   └── Notification.js      # In-app notification store
│   │   ├── routes/
│   │   │   ├── auth.routes.js       # Register, verify, login
│   │   │   ├── order.routes.js      # Customer order endpoints
│   │   │   ├── agent.routes.js      # Agent dashboard endpoints
│   │   │   ├── admin.routes.js      # Admin management endpoints
│   │   │   ├── upload.routes.js     # Multipart proof upload
│   │   │   ├── zone.routes.js       # Zone CRUD (admin)
│   │   │   ├── rateCard.routes.js   # Rate card CRUD (admin)
│   │   │   └── tracking.routes.js   # Public order tracking
│   │   ├── services/
│   │   │   ├── auth.service.js      # Register, OTP, login logic
│   │   │   ├── order.service.js     # Order CRUD + deliverability check
│   │   │   ├── pricing.service.js   # Quote calc + rate card lookup
│   │   │   ├── zone.service.js      # Zone detection by pincode
│   │   │   ├── tracking.service.js  # Append + query tracking history
│   │   │   ├── assignment.service.js # Auto-assign agent to order
│   │   │   ├── transit.simulator.js # Auto-advance order status (dev)
│   │   │   ├── email.service.js     # OTP + notification emails
│   │   │   └── notification.service.js # In-app notifications
│   │   ├── validators/
│   │   │   ├── auth.validator.js
│   │   │   ├── order.validator.js   # Supports nested package{} format
│   │   │   ├── agent.validator.js
│   │   │   ├── rateCard.validator.js
│   │   │   └── zone.validator.js
│   │   └── utils/
│   │       ├── response.js          # success() helper
│   │       ├── generateOrderId.js   # ORD-XXXXX generator
│   │       ├── cloudinaryUpload.js  # Buffer upload + base64 fallback
│   │       └── distance.js          # Haversine distance (unused, available)
│   └── scripts/
│       ├── seed-rate-cards.js       # Seeds all 32 rate cards
│       ├── update-zone-pincodes.js  # Fetches pincodes from pincodeapi.in
│       ├── fix-vja-pincodes.js      # Adds missing 520001-520015 pincodes
│       └── audit-rate-cards.js     # Validates all rate cards + boundary test
│
└── frontend/
    └── src/
        ├── api/
        │   ├── client.ts            # Axios instance (JWT interceptor, 401 logout)
        │   ├── auth.ts              # Auth API calls
        │   ├── orders.ts            # Order API calls
        │   ├── agent.ts             # Agent API calls (incl. uploadProof)
        │   └── admin.ts             # Admin API calls
        ├── context/
        │   ├── AuthContext.tsx      # Global auth state + login/logout
        │   └── CartContext.tsx      # Cart state, addresses, promo codes
        ├── components/
        │   ├── layout/
        │   │   ├── AppLayout.tsx    # Page wrapper with Navbar
        │   │   └── Navbar.tsx       # Role-aware navigation
        │   └── ui/
        │       ├── Button.tsx       # Gradient button with loading state
        │       ├── GlassCard.tsx    # Glassmorphism card container
        │       ├── Input.tsx        # Styled input with label
        │       ├── Modal.tsx        # Animated modal overlay
        │       ├── StatusBadge.tsx  # Color-coded order status badge
        │       ├── Skeleton.tsx     # Loading skeleton components
        │       └── ProductDetailModal.tsx
        ├── pages/
        │   ├── auth/
        │   │   └── LandingPage.tsx  # Login / Register / OTP flow
        │   ├── customer/
        │   │   ├── ECommerceHomePage.tsx   # Product catalogue
        │   │   ├── CartCheckoutPage.tsx    # Cart + checkout + address
        │   │   ├── OrderListPage.tsx       # My orders
        │   │   ├── OrderDetailPage.tsx     # Single order + tracking
        │   │   ├── CustomerProfilePage.tsx # Profile + saved addresses
        │   │   ├── TrackingPage.tsx        # Public tracking page
        │   │   └── CreateOrderPage.tsx     # B2B order creation
        │   ├── agent/
        │   │   ├── AgentDashboard.tsx      # Zone picker + available orders
        │   │   ├── AgentOrderListPage.tsx  # My assigned orders
        │   │   └── AgentOrderDetailPage.tsx # Order detail + proof upload
        │   └── admin/
        │       ├── AdminDashboard.tsx
        │       ├── AdminOrdersPage.tsx
        │       ├── AdminOrderDetailPage.tsx
        │       ├── AdminAgentsPage.tsx
        │       ├── AdminCustomersPage.tsx
        │       ├── AdminRateCardsPage.tsx
        │       └── AdminZonesPage.tsx
        ├── router/
        │   ├── index.tsx            # All routes defined here
        │   └── guards.tsx           # ProtectedRoute, RoleGuard components
        ├── types/index.ts           # All TypeScript interfaces
        └── utils/index.ts           # formatCurrency, formatDate, getAxiosError, etc.
```

---

## 🧪 Key Design Decisions

| Decision | Reasoning |
|----------|-----------|
| **Agent availability ≠ hard block** | Zone existence is the only hard block for order placement. Agent availability is advisory — prevents orders being rejected at checkout just because no agent is online at that exact millisecond |
| **Half-open intervals for rate cards** | Industry standard `[min, max)` prevents any weight matching 2 slabs simultaneously. Boundary weights (1kg, 5kg, etc.) always fall into the **upper** slab |
| **Base64 fallback for proof upload** | If Cloudinary is unreachable, proof is stored as data URL in DB — upload always succeeds, never blocks delivery completion |
| **Transit simulator** | Auto-advances order status in development so evaluators can see the full timeline without manual DB updates |
| **Dual payload format in pricing** | `calculateQuote` accepts both `{ package: { length } }` (frontend) and flat `{ length }` (legacy/API tools) — no breaking changes |
| **Zone pincodes via live API** | Instead of hardcoded lists, pincodes are fetched from pincodeapi.in at setup time, covering every village/mandal in Guntur & Vijayawada |
| **3-tier email fallback** | Brevo HTTP API (Port 443) is primary — avoids Render's TCP SMTP firewall. Nodemailer (Port 465 with 587 auto-retry) is secondary. Resend is last resort. All three are configurable via env vars |
| **Port 465 default over 587** | Render free tier blocks outbound Port 587 (STARTTLS). Defaulting to Port 465 (SSL) eliminates `Connection timeout` errors on cloud platforms |

---

## 📄 License

MIT — Built with ❤️ for Tier-2 India logistics.
