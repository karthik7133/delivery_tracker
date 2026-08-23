// ─── Types matching backend models ──────────────────────────────────────────

export type UserRole = 'CUSTOMER' | 'AGENT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
}

export type OrderStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type AgentStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';
export type OrderType = 'B2B' | 'B2C';
export type PaymentType = 'PREPAID' | 'COD';
export type RateType = 'INTRA_ZONE' | 'INTER_ZONE';
export type AssignmentType = 'MANUAL' | 'AUTO';

export interface Address {
  address: string;
  city: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  zoneId?: string | null;
}

export interface Package {
  length: number;
  breadth: number;
  height: number;
  actualWeight: number;
  volumetricWeight: number;
  chargeableWeight: number;
}

export interface Pricing {
  baseCharge: number;
  codSurcharge: number;
  totalCharge: number;
  rateCardId: string;
}

export interface Assignment {
  agentId?: string | null;
  assignedAt?: string | null;
  assignmentType?: AssignmentType | null;
}

export interface Reschedule {
  requested: boolean;
  newDate?: string | null;
}

export interface OrderItem {
  productId?: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  category?: string;
}

export interface Order {
  _id: string;
  orderId: string;
  customerId: string;
  pickup: Address;
  drop: Address;
  package: Package;
  items?: OrderItem[];
  orderImage?: string | null;
  orderType: OrderType;
  paymentType: PaymentType;
  pricing: Pricing;
  assignment: Assignment;
  status: OrderStatus;
  deliveryAttempt: number;
  reschedule: Reschedule;
  proofUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEntry {
  _id: string;
  orderId: string;
  status: OrderStatus;
  note?: string;
  actorId?: string;
  actorRole?: string;
  timestamp?: string;
  createdAt?: string;
}

export interface TrackingResponse {
  orderId: string;
  status: OrderStatus;
  tracking: TrackingEntry[];
}

export interface Quote {
  pickup: { city: string; pincode: string; zoneId?: string };
  drop: { city: string; pincode: string; zoneId?: string };
  rateType: RateType;
  package: Package;
  pricing: {
    baseCharge: number;
    codSurcharge: number;
    totalCharge: number;
    rateCardId: string;
  };
}

export interface AgentLocation {
  latitude: number;
  longitude: number;
}

export interface Agent {
  _id: string;
  userId: string | { _id: string; name: string; email: string; phone: string };
  vehicleType: string;
  phone: string;
  status: AgentStatus;
  currentLocation?: AgentLocation | null;
  currentZoneId?: string | null;
  assignedOrders: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Zone {
  _id: string;
  name: string;
  code: string;
  areas: string[];
  pincodes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RateCard {
  _id: string;
  orderType: OrderType;
  rateType: RateType;
  minWeight: number;
  maxWeight: number;
  ratePerKg: number;
  baseCharge: number;
  codSurcharge: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
}

// ─── Create/request payload types ────────────────────────────────────────────

export interface QuoteRequest {
  pickup: { address: string; city: string; pincode: string };
  drop: { address: string; city: string; pincode: string };
  package: { length: number; breadth: number; height: number; actualWeight: number };
  orderType: OrderType;
  paymentType: PaymentType;
}

export interface CreateOrderRequest extends QuoteRequest {
  totalAmount?: number;
  items?: OrderItem[];
  orderImage?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
