import client from './client';
import type { Order, Quote, TrackingResponse, ApiResponse, QuoteRequest, CreateOrderRequest } from '../types';

export const ordersApi = {
  quote: (data: QuoteRequest) => {
    const payload = {
      ...data,
      length: data.package.length,
      breadth: data.package.breadth,
      height: data.package.height,
      actualWeight: data.package.actualWeight,
    };
    return client.post<ApiResponse<Quote>>('/orders/quote', payload);
  },

  create: (data: CreateOrderRequest) => {
    const payload = {
      ...data,
      length: data.package.length,
      breadth: data.package.breadth,
      height: data.package.height,
      actualWeight: data.package.actualWeight,
    };
    return client.post<ApiResponse<Order>>('/orders', payload);
  },

  checkPincode: (pincode: string) =>
    client.get<ApiResponse<{ deliverable: boolean; zone?: { name: string; code: string }; message: string }>>('/orders/check-pincode', { params: { pincode } }),

  list: (params?: { status?: string }) =>
    client.get<ApiResponse<any>>('/orders', { params }),

  get: (id: string) =>
    client.get<ApiResponse<Order>>(`/orders/${id}`),

  tracking: (id: string) =>
    client.get<ApiResponse<TrackingResponse>>(`/orders/${id}/tracking`),

  reschedule: (id: string, newDate: string) =>
    client.post<ApiResponse<Order>>(`/orders/${id}/reschedule`, { newDate }),

  // Agent-specific
  agentOrders: () =>
    client.get<ApiResponse<Order[]>>('/agent/orders'),

  agentClaimable: () =>
    client.get<ApiResponse<{ items: Order[]; zoneId?: string; message?: string }>>('/agent/orders/claimable'),

  agentClaimOrder: (id: string) =>
    client.post<ApiResponse<{ message: string; order: Order }>>(`/agent/orders/${id}/claim`),

  agentUpdateStatus: (id: string, status: string, note?: string) =>
    client.patch<ApiResponse<Order>>(`/agent/orders/${id}/status`, { status, note }),
};
