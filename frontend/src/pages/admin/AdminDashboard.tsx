import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Package, Users, Truck, TrendingUp } from 'lucide-react';
import { adminApi } from '../../api/admin';
import type { Order, Agent } from '../../types';
import GlassCard from '../../components/ui/GlassCard';
import { SkeletonCard } from '../../components/ui/Skeleton';

const ORDER_STATUSES = ['CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED'];
const STATUS_COLORS: Record<string, string> = {
  CREATED: '#64748b', ASSIGNED: '#3b82f6', PICKED_UP: '#f59e0b',
  IN_TRANSIT: '#06b6d4', OUT_FOR_DELIVERY: '#f97316',
  DELIVERED: '#10b981', FAILED: '#ef4444', CANCELLED: '#6b7280',
};
const PIE_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444'];

const customTooltipStyle = {
  background: 'rgba(15, 23, 42, 0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#f1f5f9',
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      Promise.all([adminApi.listOrders(), adminApi.listAgents()])
        .then(([ordersRes, agentsRes]) => {
          const orderData = ordersRes.data.data as any;
          setOrders(Array.isArray(orderData) ? orderData : (orderData?.items ?? []));
          setAgents(agentsRes.data.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Chart data
  const statusData = ORDER_STATUSES.map((s) => ({
    status: s.replace('_', ' '),
    count: orders.filter((o) => o.status === s).length,
    fill: STATUS_COLORS[s],
  })).filter((d) => d.count > 0);

  const agentStatusData = [
    { name: 'Available', value: agents.filter((a) => a.status === 'AVAILABLE').length, color: '#10b981' },
    { name: 'Busy', value: agents.filter((a) => a.status === 'BUSY').length, color: '#f59e0b' },
    { name: 'Offline', value: agents.filter((a) => a.status === 'OFFLINE').length, color: '#64748b' },
  ];

  const totalRevenue = orders.reduce((sum, o) => sum + o.pricing.totalCharge, 0);
  const activeDeliveries = orders.filter((o) => ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PICKED_UP'].includes(o.status)).length;
  const availableAgents = agents.filter((a) => a.status === 'AVAILABLE').length;

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: Package, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: 'Active Deliveries', value: activeDeliveries, icon: Truck, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Available Agents', value: availableAgents, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">Overview of your delivery operations</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />) :
            stats.map(({ label, value, icon: Icon, color, bg }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <GlassCard className="p-5">
                  <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon size={24} className={color} />
                  </div>
                  <motion.p
                    className="text-2xl font-black text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    {value}
                  </motion.p>
                  <p className="text-sm text-slate-400 mt-1">{label}</p>
                </GlassCard>
              </motion.div>
            ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
            <GlassCard hover={false}>
              <h3 className="font-bold text-white mb-6">Orders by Status</h3>
              {loading ? <div className="skeleton h-48 rounded-xl" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={statusData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="status" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </GlassCard>
          </motion.div>

          {/* Pie Chart */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
            <GlassCard hover={false}>
              <h3 className="font-bold text-white mb-6">Agent Status</h3>
              {loading ? <div className="skeleton h-48 rounded-xl" /> : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={agentStatusData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                        {agentStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={customTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {agentStatusData.map(({ name, value, color }) => (
                      <div key={name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="text-slate-400">{name}</span>
                        </div>
                        <span className="text-white font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
