import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ArrowRight, Filter } from 'lucide-react';
import { agentApi } from '../../api/agent';
import type { Order, OrderStatus } from '../../types';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { SkeletonList } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const statusFilters = [
  { label: 'All', value: '' },
  { label: 'Assigned', value: 'ASSIGNED' },
  { label: 'Picked Up', value: 'PICKED_UP' },
  { label: 'In Transit', value: 'IN_TRANSIT' },
  { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', value: 'DELIVERED' },
];

export default function AgentOrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    agentApi.listOrders()
      .then((res) => setOrders(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-black text-white">My Deliveries</h1>
          <p className="text-slate-400 mt-1">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>
        </motion.div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Filter size={16} className="text-slate-400 flex-shrink-0" />
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                filter === f.value
                  ? 'gradient-bg text-white'
                  : 'glass text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? <SkeletonList count={4} /> : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center mx-auto mb-4 float-animation">
              <Package size={36} className="text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No orders found</h3>
            <p className="text-slate-400">No deliveries match your filter</p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
            {filtered.map((order) => (
              <motion.div key={order._id} variants={itemVariants}>
                <GlassCard onClick={() => navigate(`/agent/orders/${order._id}`)} className="cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-emerald-400">{order.orderId}</span>
                        <StatusBadge status={order.status as OrderStatus} />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <span>{order.pickup.city}</span>
                        <ArrowRight size={14} className="text-slate-500" />
                        <span>{order.drop.city}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{formatDate(order.createdAt)}</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrink-0 ml-4" />
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
