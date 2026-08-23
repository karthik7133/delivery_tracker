import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Package, ArrowRight, Phone, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ordersApi } from '../../api/orders';
import type { TrackingResponse, OrderStatus } from '../../types';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { formatDate, getAxiosError, getStatusLabel } from '../../utils';

const ALL_STATUSES: OrderStatus[] = [
  'CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED',
];

export default function TrackingPage() {
  const [orderId, setOrderId] = useState('');
  const [result, setResult] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!orderId.trim()) return;
    setLoading(true);
    try {
      // Use tracking route (by mongodb _id or orderId prefix search via order list)
      const listRes = await ordersApi.list();
      const items: any[] = Array.isArray(listRes.data.data) ? listRes.data.data : (listRes.data.data?.items ?? []);
      const match = items.find(
        (o: any) => o.orderId === orderId.trim() || o._id === orderId.trim()
      );
      if (!match) {
        toast.error('Order not found');
        return;
      }
      const trackRes = await ordersApi.tracking(match._id);
      setResult(trackRes.data.data);
    } catch (err) {
      toast.error(getAxiosError(err));
    } finally {
      setLoading(false);
    }
  };

  const currentStatusIndex = result ? ALL_STATUSES.indexOf(result.status as OrderStatus) : -1;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <h1 className="text-3xl font-black text-white mb-2">Track Your Package</h1>
          <p className="text-slate-400">Enter your order ID to get real-time updates</p>
        </motion.div>

        {/* Search */}
        <GlassCard hover={false} className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label="Order ID"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} loading={loading} icon={<Search size={18} />} className="mt-auto flex-shrink-0">
              Track
            </Button>
          </div>
        </GlassCard>

        {/* Result */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Journey Visualization */}
            <GlassCard hover={false}>
              <div className="text-center mb-6">
                <p className="text-sm text-slate-400 mb-1">Order</p>
                <h2 className="text-xl font-black font-mono text-emerald-400">{result.orderId}</h2>
                <div className="mt-2 flex justify-center">
                  <StatusBadge status={result.status as OrderStatus} />
                </div>
              </div>

              {/* Status Track */}
              <div className="overflow-x-auto pb-2">
                <div className="flex items-center min-w-max mx-auto">
                  {['CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((status, i, arr) => {
                    const reached = ALL_STATUSES.indexOf(result.status as OrderStatus) >= ALL_STATUSES.indexOf(status as OrderStatus);
                    const isActive = result.status === status;
                    return (
                      <div key={status} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <motion.div
                            animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 1, repeat: isActive ? Infinity : 0, repeatDelay: 1 }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                              reached ? 'gradient-bg glow-emerald' : 'glass border border-white/10'
                            }`}
                          >
                            {status === 'CREATED' ? '📋' : status === 'ASSIGNED' ? '👤' : status === 'PICKED_UP' ? '📦' : status === 'IN_TRANSIT' ? '🚚' : status === 'OUT_FOR_DELIVERY' ? '🏠' : '✅'}
                          </motion.div>
                          <p className={`text-xs mt-1 font-medium whitespace-nowrap ${reached ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {getStatusLabel(status as OrderStatus)}
                          </p>
                        </div>
                        {i < arr.length - 1 && (
                          <div className={`w-12 h-0.5 mx-1 rounded-full transition-all ${
                            currentStatusIndex > i ? 'bg-emerald-500' : 'bg-white/10'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>
            {/* Agent Info — shown when OUT_FOR_DELIVERY */}
            {result.status === 'OUT_FOR_DELIVERY' && (result as any).assignment?.agentId && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-3">🛵 Your Delivery Agent</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                      <User size={22} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white">
                        {typeof (result as any).assignment.agentId === 'object'
                          ? ((result as any).assignment.agentId.userId?.name || 'Delivery Agent')
                          : 'Delivery Agent'}
                      </p>
                      {(() => {
                        const agentPhone = typeof (result as any).assignment.agentId === 'object'
                          ? ((result as any).assignment.agentId.phone || (result as any).assignment.agentId.userId?.phone)
                          : null;
                        return agentPhone ? (
                          <a href={`tel:${agentPhone}`} className="flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 text-sm mt-1 font-medium transition-colors">
                            <Phone size={13} />{agentPhone}
                          </a>
                        ) : null;
                      })()} 
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <GlassCard hover={false}>
              <h3 className="font-bold text-white mb-4">History</h3>
              {result.tracking.length === 0 ? (
                <p className="text-slate-400 text-sm">No updates yet</p>
              ) : (
                <div className="space-y-4">
                  {result.tracking.map((entry, i) => (
                    <motion.div
                      key={entry._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      <div>
                        <StatusBadge status={entry.status as OrderStatus} />
                        {entry.note && <p className="text-sm text-slate-300 mt-1">{entry.note}</p>}
                        <p className="text-xs text-slate-500 mt-1">{formatDate(entry.timestamp || entry.createdAt || '')}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* Empty CTA */}
        {!result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.3 } }} className="text-center py-12">
            <div className="w-24 h-24 glass rounded-3xl flex items-center justify-center mx-auto mb-4 float-animation">
              <Package size={44} className="text-slate-500" />
            </div>
            <p className="text-slate-400">Enter an order ID above to start tracking</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
