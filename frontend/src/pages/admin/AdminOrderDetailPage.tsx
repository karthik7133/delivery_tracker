import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ArrowLeft, UserCheck, Zap, Settings, Clock, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../../api/admin';
import type { Order, Agent, OrderStatus, TrackingEntry } from '../../types';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { formatCurrency, formatDate, getAxiosError, getStatusLabel, ALL_ORDER_STATUSES } from '../../utils';
import { ordersApi } from '../../api/orders';

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<TrackingEntry[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [overriding, setOverriding] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      adminApi.getOrder(id),
      adminApi.listAgents({ status: 'AVAILABLE' }),
      ordersApi.tracking(id).catch(() => ({ data: { data: { tracking: [] } } })),
    ]).then(([orderRes, agentsRes, trackRes]) => {
      setOrder(orderRes.data.data);
      setAgents(agentsRes.data.data);
      setTracking((trackRes as any).data.data.tracking ?? []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const assign = async () => {
    if (!selectedAgent || !id) return;
    setAssigning(true);
    try {
      const res = await adminApi.assignAgent(id, selectedAgent);
      setOrder(res.data.data);
      toast.success('Agent assigned!');
    } catch (err) { toast.error(getAxiosError(err)); }
    finally { setAssigning(false); }
  };

  const autoAssign = async () => {
    if (!id) return;
    setAutoAssigning(true);
    try {
      const res = await adminApi.autoAssign(id);
      setOrder(res.data.data);
      toast.success('Agent auto-assigned!');
    } catch (err) { toast.error(getAxiosError(err)); }
    finally { setAutoAssigning(false); }
  };

  const overrideStatus = async () => {
    if (!newStatus || !id) return;
    setOverriding(true);
    try {
      const res = await adminApi.updateOrderStatus(id, newStatus, statusNote || undefined);
      setOrder(res.data.data);
      toast.success(`Status updated to ${getStatusLabel(newStatus)}`);
      setNewStatus('');
      setStatusNote('');
    } catch (err) { toast.error(getAxiosError(err)); }
    finally { setOverriding(false); }
  };

  if (loading) return <div className="min-h-screen py-8 px-4 max-w-4xl mx-auto space-y-4"><SkeletonCard /><SkeletonCard /></div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-400">Order not found</p></div>;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => navigate('/admin/orders')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={16} /> Back to orders
        </button>

        {/* Header */}
        <GlassCard hover={false}>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black font-mono text-emerald-400">{order.orderId}</h1>
              <p className="text-xs text-slate-500 mt-1">{formatDate(order.createdAt)}</p>
            </div>
            <StatusBadge status={order.status as OrderStatus} />
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-slate-400">Route:</span> <span className="text-white ml-1">{order.pickup.city} → {order.drop.city}</span></div>
            <div><span className="text-slate-400">Type:</span> <span className="text-white ml-1">{order.orderType}</span></div>
            <div><span className="text-slate-400">Payment:</span> <span className="text-white ml-1">{order.paymentType}</span></div>
            <div><span className="text-slate-400">Total:</span> <span className="text-emerald-400 font-bold ml-1">{formatCurrency(order.pricing.totalCharge)}</span></div>
          </div>
        </GlassCard>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Agent Assignment */}
          <GlassCard hover={false}>
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><UserCheck size={16} className="text-emerald-400" /> Agent Assignment</h3>
            {order.assignment?.agentId && (
              <div className="mb-4 p-3 glass rounded-xl">
                <p className="text-xs text-emerald-400 font-semibold mb-1">CURRENTLY ASSIGNED</p>
                <p className="text-white text-sm font-mono">{typeof order.assignment.agentId === 'string' ? order.assignment.agentId : 'Agent'}</p>
                <p className="text-slate-500 text-xs">{order.assignment.assignmentType} · {order.assignment.assignedAt ? formatDate(order.assignment.assignedAt) : ''}</p>
              </div>
            )}
            <div className="space-y-3">
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full glass rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="">Select available agent...</option>
                {agents.map((a) => (
                  <option key={a._id} value={a._id}>
                    {typeof a.userId === 'object' ? a.userId.name : 'Agent'} ({a.vehicleType})
                  </option>
                ))}
              </select>
              <Button onClick={assign} loading={assigning} disabled={!selectedAgent} className="w-full" icon={<UserCheck size={16} />}>
                Assign Agent
              </Button>
              <Button variant="secondary" onClick={autoAssign} loading={autoAssigning} className="w-full" icon={<Zap size={16} />}>
                Auto-Assign
              </Button>
            </div>
          </GlassCard>

          {/* Status Override */}
          <GlassCard hover={false}>
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Settings size={16} className="text-sky-400" /> Status Override</h3>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
              className="w-full glass rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40 mb-3"
            >
              <option value="">Select new status...</option>
              {ALL_ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{getStatusLabel(s)}</option>
              ))}
            </select>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Admin note (optional)..."
              rows={2}
              className="w-full glass rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 resize-none mb-3"
            />
            <Button onClick={overrideStatus} loading={overriding} disabled={!newStatus} className="w-full" variant="secondary" icon={<Settings size={16} />}>
              Override Status
            </Button>
          </GlassCard>
        </div>

        {/* Tracking History */}
        <GlassCard hover={false}>
          <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Clock size={16} className="text-sky-400" /> Tracking History</h3>
          {tracking.length === 0 ? (
            <p className="text-slate-400 text-sm">No tracking updates</p>
          ) : (
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500/50 to-transparent" />
              <div className="space-y-6">
                {tracking.map((entry, i) => (
                  <motion.div key={entry._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex gap-4 pl-2">
                    <div className="relative z-10 w-8 h-8 rounded-full glass border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    </div>
                    <div>
                      <StatusBadge status={entry.status as OrderStatus} />
                      {entry.note && <p className="text-sm text-slate-300 mt-1">{entry.note}</p>}
                      {entry.actorRole && <p className="text-xs text-slate-500 mt-0.5">by {entry.actorRole}</p>}
                      <p className="text-xs text-slate-500 mt-1">{formatDate(entry.timestamp || entry.createdAt || '')}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
