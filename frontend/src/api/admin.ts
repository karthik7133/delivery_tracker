import client from './client';
import type {
  Order, Agent, Zone, RateCard, Customer,
  OrderStatus, AgentStatus, OrderType, RateType,
  ApiResponse,
} from '../types';

export const adminApi = {
  // Orders
  listOrders: (params?: { status?: string; agentId?: string; page?: number }) =>
    client.get<ApiResponse<Order[]>>('/admin/orders', { params }),

  getOrder: (id: string) =>
    client.get<ApiResponse<Order>>(`/admin/orders/${id}`),

  assignAgent: (orderId: string, agentId: string) =>
    client.post<ApiResponse<Order>>(`/admin/orders/${orderId}/assign`, { agentId }),

  autoAssign: (orderId: string) =>
    client.post<ApiResponse<Order>>(`/admin/orders/${orderId}/auto-assign`),

  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) =>
    client.patch<ApiResponse<Order>>(`/admin/orders/${orderId}/status`, { status, note }),

  // Agents
  listAgents: (params?: { status?: AgentStatus }) =>
    client.get<ApiResponse<Agent[]>>('/admin/agents', { params }),

  getAgent: (id: string) =>
    client.get<ApiResponse<Agent>>(`/admin/agents/${id}`),

  updateAgentStatus: (id: string, status: AgentStatus) =>
    client.patch<ApiResponse<Agent>>(`/admin/agents/${id}/status`, { status }),

  updateAgentZone: (id: string, zoneId: string | null) =>
    client.patch<ApiResponse<Agent>>(`/admin/agents/${id}/zone`, { zoneId }),


  // Customers
  listCustomers: () =>
    client.get<ApiResponse<Customer[]>>('/admin/customers'),

  // Zones
  listZones: () =>
    client.get<ApiResponse<Zone[]>>('/admin/zones'),

  createZone: (data: { name: string; code: string; areas: string[]; pincodes: string[] }) =>
    client.post<ApiResponse<Zone>>('/admin/zones', data),

  updateZone: (id: string, data: { name: string; code: string; areas: string[]; pincodes: string[] }) =>
    client.put<ApiResponse<Zone>>(`/admin/zones/${id}`, data),

  deleteZone: (id: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/admin/zones/${id}`),

  addZoneAreas: (id: string, areas: string[]) =>
    client.post<ApiResponse<Zone>>(`/admin/zones/${id}/areas`, { areas }),

  removeZoneArea: (id: string, area: string) =>
    client.delete<ApiResponse<Zone>>(`/admin/zones/${id}/areas/${encodeURIComponent(area)}`),

  // Rate Cards
  listRateCards: (params?: { orderType?: OrderType; rateType?: RateType }) =>
    client.get<ApiResponse<RateCard[]>>('/admin/rate-cards', { params }),

  createRateCard: (data: Partial<RateCard>) =>
    client.post<ApiResponse<RateCard>>('/admin/rate-cards', data),

  updateRateCard: (id: string, data: Partial<RateCard>) =>
    client.put<ApiResponse<RateCard>>(`/admin/rate-cards/${id}`, data),

  deleteRateCard: (id: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/admin/rate-cards/${id}`),
};
