import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, Search, ArrowRight, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/admin';
import type { Order, OrderStatus } from '../../types';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { formatCurrency, formatDate, getAxiosError } from '../../utils';

const STATUS_FILTERS = ['', 'CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [autoAssigningId, setAutoAssigningId] = useState<string | null>(null);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchOrders = () => {
      adminApi.listOrders(statusFilter ? { status: statusFilter } : undefined)
        .then((res) => {
          const data = res.data.data as any;
          setOrders(Array.isArray(data) ? data : (data?.items ?? []));
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const autoAssign = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAutoAssigningId(orderId);
    try {
      await adminApi.autoAssign(orderId);
      toast.success('Agent auto-assigned!');
      // refresh
      adminApi.listOrders(statusFilter ? { status: statusFilter } : undefined)
        .then((res) => {
          const data = res.data.data as any;
          setOrders(Array.isArray(data) ? data : (data?.items ?? []));
        });
    } catch (err) {
      toast.error(getAxiosError(err));
    } finally {
      setAutoAssigningId(null);
    }
  };

  const filtered = search
    ? orders.filter((o) => o.orderId.toLowerCase().includes(search.toLowerCase()) || o.pickup.city.toLowerCase().includes(search.toLowerCase()))
    : orders;


  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black text-white">All Orders</h1>
          <p className="text-slate-400 mt-1">{filtered.length} orders</p>
        </motion.div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order ID or city..."
              className="w-full glass rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter size={16} className="text-slate-400 flex-shrink-0" />
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === s
                    ? 'gradient-bg text-white'
                    : 'glass text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? <SkeletonTable rows={6} cols={6} /> : (
          <GlassCard hover={false} className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Order ID', 'Status', 'Route', 'Type', 'Total', 'Date', ''].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, i) => (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => navigate(`/admin/orders/${order._id}`)}
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-4 font-mono text-sm text-emerald-400 font-bold">{order.orderId}</td>
                      <td className="px-5 py-4"><StatusBadge status={order.status as OrderStatus} /></td>
                      <td className="px-5 py-4 text-sm text-slate-300">
                        <div className="flex items-center gap-1">
                          <span>{order.pickup.city}</span>
                          <ArrowRight size={12} className="text-slate-500" />
                          <span>{order.drop.city}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400">{order.orderType}</td>
                      <td className="px-5 py-4 text-sm font-bold text-white">{formatCurrency(order.pricing.totalCharge)}</td>
                      <td className="px-5 py-4 text-xs text-slate-500">{formatDate(order.createdAt)}</td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        {order.status === 'CREATED' ? (
                          <button
                            onClick={(e) => autoAssign(order._id, e)}
                            disabled={autoAssigningId === order._id}
                            title="Auto-assign nearest agent"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 transition-all disabled:opacity-50"
                          >
                            {autoAssigningId === order._id ? (
                              <span className="animate-spin text-base">⏳</span>
                            ) : (
                              <><Zap size={12} />Auto</>
                            )}
                          </button>
                        ) : (
                          <ArrowRight size={14} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                        )}
                      </td>
                    </motion.tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">No orders found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
