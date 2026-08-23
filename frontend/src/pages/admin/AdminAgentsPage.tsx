import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Users, Filter, Truck, MapPin } from 'lucide-react';
import { adminApi } from '../../api/admin';
import type { Agent, AgentStatus, Zone } from '../../types';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import { SkeletonList } from '../../components/ui/Skeleton';
import { getAxiosError } from '../../utils';

const STATUS_COLORS: Record<AgentStatus, string> = {
  AVAILABLE: 'text-emerald-400',
  BUSY: 'text-amber-400',
  OFFLINE: 'text-slate-500',
};

const STATUS_DOT: Record<AgentStatus, string> = {
  AVAILABLE: 'bg-emerald-400 animate-pulse',
  BUSY: 'bg-amber-400',
  OFFLINE: 'bg-slate-600',
};

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AgentStatus | ''>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [zoneUpdatingId, setZoneUpdatingId] = useState<string | null>(null);

  const fetchAgents = () => {
    adminApi.listAgents(filter ? { status: filter } : undefined)
      .then((res) => setAgents(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAgents(); }, [filter]);
  useEffect(() => {
    adminApi.listZones().then((res) => setZones(res.data.data)).catch(console.error);
  }, []);

  const changeStatus = async (id: string, status: AgentStatus) => {
    setUpdatingId(id);
    try {
      await adminApi.updateAgentStatus(id, status);
      setAgents((prev) => prev.map((a) => a._id === id ? { ...a, status } : a));
      toast.success(`Agent status updated to ${status}`);
    } catch (err) { toast.error(getAxiosError(err)); }
    finally { setUpdatingId(null); }
  };

  const changeZone = async (id: string, zoneId: string) => {
    setZoneUpdatingId(id);
    try {
      await adminApi.updateAgentZone(id, zoneId || null);
      const zoneName = zones.find(z => z._id === zoneId)?.name || 'None';
      setAgents((prev) => prev.map((a) => a._id === id ? { ...a, currentZoneId: zoneId ? { _id: zoneId, name: zoneName } as any : null } : a));
      toast.success(`Zone updated to ${zoneName}`);
    } catch (err) { toast.error(getAxiosError(err)); }
    finally { setZoneUpdatingId(null); }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black text-white flex items-center gap-3"><Users size={28} className="text-emerald-400" /> Agents</h1>
          <p className="text-slate-400 mt-1">{agents.length} agents registered</p>
        </motion.div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400 flex-shrink-0" />
          {(['' , 'AVAILABLE', 'BUSY', 'OFFLINE'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setFilter(s); setLoading(true); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === s ? 'gradient-bg text-white' : 'glass text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? <SkeletonList count={4} /> : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid md:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const user = typeof agent.userId === 'object' ? agent.userId : null;
              const currentZone = typeof agent.currentZoneId === 'object' ? agent.currentZoneId : null;
              return (
                <motion.div key={agent._id} variants={itemVariants}>
                  <GlassCard>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[agent.status]}`} />
                          <h3 className="font-bold text-white">{user?.name ?? 'Agent'}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
                        <p className="text-xs text-slate-400">{user?.phone ?? agent.phone}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${STATUS_COLORS[agent.status]}`}>{agent.status}</span>
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <Truck size={12} className="text-slate-500" />
                          <span className="text-xs text-slate-400">{agent.vehicleType}</span>
                        </div>
                      </div>
                    </div>

                    {/* Zone assignment */}
                    <div className="mb-3 flex items-center gap-2">
                      <MapPin size={13} className="text-sky-400 shrink-0" />
                      <select
                        value={typeof agent.currentZoneId === 'object' ? (agent.currentZoneId as any)?._id || '' : (agent.currentZoneId as string) || ''}
                        onChange={(e) => changeZone(agent._id, e.target.value)}
                        disabled={zoneUpdatingId === agent._id}
                        className="flex-1 text-xs bg-white/5 border border-white/10 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                      >
                        <option value="" className="bg-slate-900">— No zone assigned —</option>
                        {zones.map((z) => (
                          <option key={z._id} value={z._id} className="bg-slate-900">{z.name} ({z.code})</option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-4 text-xs text-slate-500">
                      {currentZone ? (
                        <span className="text-sky-400 font-medium">📍 {(currentZone as any).name} ({(currentZone as any).code})</span>
                      ) : (
                        <span className="text-amber-400">⚠ Not assigned to any zone</span>
                      )}
                      {' · '}{agent.assignedOrders.length} order{agent.assignedOrders.length !== 1 ? 's' : ''}
                    </div>

                    <div className="flex gap-2">
                      {(['AVAILABLE', 'BUSY', 'OFFLINE'] as AgentStatus[]).map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={agent.status === s ? 'primary' : 'secondary'}
                          loading={updatingId === agent._id}
                          onClick={() => changeStatus(agent._id, s)}
                          className="flex-1 text-xs"
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
            {agents.length === 0 && (
              <p className="text-slate-400 col-span-2 text-center py-12">No agents found</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
