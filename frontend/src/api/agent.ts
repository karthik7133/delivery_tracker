import client from './client';
import type { Order, AgentStatus, Agent, Zone, ApiResponse } from '../types';

export const agentApi = {
  getProfile: () =>
    client.get<ApiResponse<Agent>>('/agent/profile'),

  getStatus: () =>
    client.get<ApiResponse<{ status: AgentStatus }>>('/agent/status'),

  updateStatus: (status: AgentStatus) =>
    client.patch<ApiResponse<{ message: string; status: AgentStatus }>>('/agent/status', { status }),

  updateZone: (zoneId: string | null) =>
    client.patch<ApiResponse<{ message: string; agent: Agent }>>('/agent/zone', { zoneId }),

  listZones: () =>
    client.get<ApiResponse<Zone[]>>('/agent/zones'),

  updateLocation: (latitude: number, longitude: number) =>
    client.patch<ApiResponse<{ message: string }>>('/agent/location', { latitude, longitude }),

  listOrders: () =>
    client.get<ApiResponse<Order[]>>('/agent/orders'),

  getOrder: (id: string) =>
    client.get<ApiResponse<Order>>(`/agent/orders/${id}`),

  updateOrderStatus: (id: string, status: string, note?: string) =>
    client.patch<ApiResponse<Order>>(`/agent/orders/${id}/status`, { status, note }),

  uploadProof: (id: string, file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return client.post<ApiResponse<{ proofUrl: string }>>(`/agent/orders/${id}/proof`, form, {
      transformRequest: [
        (data, headers) => {
          // Remove the default application/json so axios sets multipart/form-data with boundary
          delete headers['Content-Type'];
          return data;
        },
      ],
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
  },
};
