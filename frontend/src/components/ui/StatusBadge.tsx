import type { OrderStatus } from '../../types';

const statusConfig: Record<OrderStatus, { label: string; color: string; dot: string; pulse: boolean }> = {
  CREATED: {
    label: 'Created',
    color: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
    dot: 'bg-slate-400',
    pulse: false,
  },
  ASSIGNED: {
    label: 'Assigned',
    color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    dot: 'bg-blue-400',
    pulse: false,
  },
  PICKED_UP: {
    label: 'Picked Up',
    color: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    dot: 'bg-amber-400',
    pulse: true,
  },
  IN_TRANSIT: {
    label: 'In Transit',
    color: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    dot: 'bg-sky-400',
    pulse: true,
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    color: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    dot: 'bg-orange-400',
    pulse: true,
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    dot: 'bg-emerald-400',
    pulse: false,
  },
  FAILED: {
    label: 'Failed',
    color: 'bg-red-500/20 text-red-300 border border-red-500/30',
    dot: 'bg-red-400',
    pulse: false,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    dot: 'bg-gray-500',
    pulse: false,
  },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status] ?? statusConfig.CREATED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`} />
      {config.label}
    </span>
  );
}
