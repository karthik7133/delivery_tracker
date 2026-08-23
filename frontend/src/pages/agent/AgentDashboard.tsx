import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Package, CheckCircle, Clock, XCircle, MapPin, Wifi,
  Inbox, ArrowRight, Truck, Globe2, ChevronRight, X, Search,
} from 'lucide-react';
import { agentApi } from '../../api/agent';
import { ordersApi } from '../../api/orders';
import type { AgentStatus, Order, Zone, Agent } from '../../types';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { SkeletonList } from '../../components/ui/Skeleton';
import { getAxiosError, formatDate, formatCurrency } from '../../utils';

const agentStatusConfig: Record<AgentStatus, { label: string; color: string; icon: React.ElementType; glow: string; dot: string }> = {
  AVAILABLE: { label: 'Available', color: 'text-emerald-400', icon: CheckCircle, glow: 'glow-emerald', dot: 'bg-emerald-400 animate-pulse' },
  BUSY:      { label: 'Busy',      color: 'text-amber-400',   icon: Clock,        glow: '',           dot: 'bg-amber-400' },
  OFFLINE:   { label: 'Offline',   color: 'text-slate-500',   icon: XCircle,      glow: '',           dot: 'bg-slate-500' },
};

/* ── Pincode API enrichment — gets district name for a zone's first pincode ── */
async function fetchPincodeInfo(pincode: string): Promise<{ district: string; state: string } | null> {
  try {
    const res = await fetch(`https://api.pincodeapi.in/api/v1/pincode/${pincode}`);
    const json = await res.json();
    if (json.success && json.data?.post_offices?.length) {
      const po = json.data.post_offices[0];
      return { district: po.district, state: po.state };
    }
  } catch { /* silent */ }
  return null;
}

/* ── Zone Picker Modal ── */
function ZonePicker({
  zones,
  currentZoneId,
  onSelect,
  onClose,
}: {
  zones: Zone[];
  currentZoneId: string | null;
  onSelect: (zoneId: string) => void;
  onClose: () => void;
}) {
  const [pincodeInfo, setPincodeInfo] = useState<Record<string, { district: string; state: string }>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    zones.forEach((z) => {
      const firstPin = z.pincodes[0];
      if (firstPin && !pincodeInfo[z._id]) {
        fetchPincodeInfo(firstPin).then((info) => {
          if (info) setPincodeInfo((prev) => ({ ...prev, [z._id]: info }));
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones]);

  const filtered = search.trim()
    ? zones.filter((z) =>
        z.name.toLowerCase().includes(search.toLowerCase()) ||
        z.code.toLowerCase().includes(search.toLowerCase()) ||
        z.pincodes.some((p) => p.includes(search)) ||
        pincodeInfo[z._id]?.district?.toLowerCase().includes(search.toLowerCase())
      )
    : zones;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg glass-strong rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h3 className="text-lg font-black text-white">Select Your Delivery Zone</h3>
            <p className="text-xs text-slate-400 mt-0.5">Orders in your zone will appear in "Available to Claim"</p>
          </div>
          <button onClick={onClose} className="p-2 glass rounded-xl hover:bg-white/10 transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3 glass rounded-xl px-4 py-2.5">
            <Search size={16} className="text-slate-500 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search zones, pincodes, districts..."
              className="bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none flex-1"
              autoFocus
            />
          </div>
        </div>

        {/* Zones list */}
        <div className="overflow-y-auto max-h-96 p-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">No zones match your search</p>
          ) : (
            filtered.map((zone) => {
              const info = pincodeInfo[zone._id];
              const isSelected = zone._id === currentZoneId;
              return (
                <motion.button
                  key={zone._id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onSelect(zone._id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'gradient-bg border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                      : 'glass border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>{zone.code}</span>
                        <span className="font-bold text-white text-sm">{zone.name}</span>
                        {isSelected && (
                          <span className="text-xs text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full ml-auto">
                            ✓ Current
                          </span>
                        )}
                      </div>
                      {info && (
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin size={10} className="shrink-0" />
                          {info.district}, {info.state}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        {zone.pincodes.slice(0, 5).join(', ')}{zone.pincodes.length > 5 ? ` +${zone.pincodes.length - 5} more` : ''}
                      </p>
                    </div>
                    <ChevronRight size={16} className={isSelected ? 'text-white' : 'text-slate-500'} />
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

export default function AgentDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [claimable, setClaimable] = useState<Order[]>([]);
  const [claimableMsg, setClaimableMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [claimableLoading, setClaimableLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<AgentStatus>('OFFLINE');
  const [statusLoading, setStatusLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [agentProfile, setAgentProfile] = useState<Agent | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [zoneUpdating, setZoneUpdating] = useState(false);
  const navigate = useNavigate();

  /* ── Fetch orders + claimable ── */
  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, claimableRes] = await Promise.all([
        agentApi.listOrders(),
        ordersApi.agentClaimable(),
      ]);
      setOrders(ordersRes.data.data);
      setClaimable(claimableRes.data.data.items || []);
      setClaimableMsg(claimableRes.data.data.message || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setClaimableLoading(false);
    }
  }, []);

  /* ── Fetch profile (status + zone) ── */
  const fetchProfile = useCallback(async () => {
    try {
      const res = await agentApi.getProfile();
      const profile = res.data.data;
      setAgentProfile(profile);
      setCurrentStatus(profile.status);
    } catch { /* silent */ }
  }, []);

  /* ── Fetch zones for picker ── */
  const fetchZones = useCallback(async () => {
    try {
      const res = await agentApi.listZones();
      setZones(res.data.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchData();
    fetchZones();
  }, [fetchProfile, fetchData, fetchZones]);

  /* ── Change availability status ── */
  const changeStatus = async (status: AgentStatus) => {
    if (statusLoading) return;
    setStatusLoading(true);
    try {
      const res = await agentApi.updateStatus(status);
      setCurrentStatus(res.data.data.status);
      toast.success(`Status set to ${res.data.data.status}`);
    } catch (err) {
      toast.error(getAxiosError(err));
    } finally {
      setStatusLoading(false);
    }
  };

  /* ── Select zone ── */
  const selectZone = async (zoneId: string) => {
    setZoneUpdating(true);
    setShowZonePicker(false);
    try {
      const res = await agentApi.updateZone(zoneId);
      setAgentProfile((prev) => prev ? { ...prev, ...(res.data.data.agent as any) } : res.data.data.agent as any);
      toast.success('Zone updated! Refreshing available orders…');
      // Refresh claimable orders for new zone
      setClaimableLoading(true);
      fetchData();
    } catch (err) {
      toast.error(getAxiosError(err));
    } finally {
      setZoneUpdating(false);
    }
  };

  /* ── Claim order ── */
  const claimOrder = async (orderId: string) => {
    setClaimingId(orderId);
    try {
      await ordersApi.agentClaimOrder(orderId);
      toast.success('Order claimed! Customer has been notified via email.');
      fetchData();
    } catch (err) {
      toast.error(getAxiosError(err));
    } finally {
      setClaimingId(null);
    }
  };

  /* ── Update GPS location ── */
  const updateLocation = async () => {
    setLocationLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );
      await agentApi.updateLocation(pos.coords.latitude, pos.coords.longitude);
      toast.success('Location updated!');
    } catch {
      toast.error('Could not get location. Please allow location access.');
    } finally {
      setLocationLoading(false);
    }
  };

  const config = agentStatusConfig[currentStatus];
  const StatusIcon = config.icon;
  const activeOrders = orders.filter((o) => !['DELIVERED', 'CANCELLED', 'FAILED'].includes(o.status));

  // Zone from profile
  const currentZone = (agentProfile as any)?.currentZoneId as (Zone & { _id: string }) | null | undefined;
  const hasZone = !!currentZone && typeof currentZone === 'object' && currentZone._id;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black text-white mb-1">Agent Dashboard</h1>
          <p className="text-slate-400">Manage your deliveries and status</p>
        </motion.div>

        {/* ── Zone Banner — shown if no zone set ── */}
        <AnimatePresence>
          {!hasZone && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <button
                onClick={() => setShowZonePicker(true)}
                className="w-full p-5 rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Globe2 size={22} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-amber-300 text-sm">⚠️ No delivery zone selected</p>
                    <p className="text-xs text-amber-400/70 mt-0.5">
                      Select your zone to see orders available in your area
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-amber-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Status + Zone Card ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard hover={false} className={currentStatus === 'AVAILABLE' ? 'glow-emerald' : ''}>

            {/* Status row */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl glass flex items-center justify-center ${config.glow}`}>
                  {React.createElement(StatusIcon as React.FC<{size?: number; className?: string}>, { size: 28, className: config.color })}
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Your Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                    <h2 className={`text-2xl font-black ${config.color}`}>{config.label}</h2>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['AVAILABLE', 'BUSY', 'OFFLINE'] as AgentStatus[]).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={currentStatus === s ? 'primary' : 'secondary'}
                    loading={statusLoading}
                    disabled={statusLoading}
                    onClick={() => changeStatus(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            {/* Zone row */}
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 glass rounded-xl flex items-center justify-center">
                    <Globe2 size={16} className={hasZone ? 'text-emerald-400' : 'text-slate-500'} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Delivery Zone</p>
                    {hasZone ? (
                      <p className="text-sm font-bold text-white">
                        {(currentZone as any).name}
                        <span className="ml-2 text-xs text-emerald-400 font-normal">{(currentZone as any).code}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500 italic">Not selected</p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={zoneUpdating}
                  onClick={() => setShowZonePicker(true)}
                  icon={<Globe2 size={13} />}
                >
                  {hasZone ? 'Change Zone' : 'Select Zone'}
                </Button>
              </div>
            </div>

          </GlassCard>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {([
            { label: 'Total Orders', value: orders.length, icon: Package, color: 'text-sky-400' },
            { label: 'Active', value: activeOrders.length, icon: Clock, color: 'text-amber-400' },
            { label: 'Delivered', value: orders.filter((o) => o.status === 'DELIVERED').length, icon: CheckCircle, color: 'text-emerald-400' },
            { label: 'Claimable', value: claimable.length, icon: Inbox, color: 'text-purple-400' },
          ] as { label: string; value: number; icon: React.ElementType; color: string }[]).map(({ label, value, icon: Icon, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
              <GlassCard className="text-center p-4">
                {React.createElement(Icon as React.FC<{size?: number; className?: string}>, { size: 24, className: `${color} mx-auto mb-2` })}
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* ── Available to Claim ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center gap-2 mb-4">
            <Inbox size={18} className="text-purple-400" />
            <h3 className="font-bold text-white text-lg">Available to Claim</h3>
            {claimable.length > 0 && (
              <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                {claimable.length} new
              </span>
            )}
            {hasZone && (
              <span className="ml-auto text-xs text-slate-500 flex items-center gap-1">
                <Globe2 size={11} /> {(currentZone as any).name}
              </span>
            )}
          </div>

          {claimableLoading ? <SkeletonList count={2} /> : !hasZone ? (
            <div className="glass rounded-2xl p-6 text-center border border-amber-500/20">
              <Globe2 size={32} className="text-amber-500/40 mx-auto mb-2" />
              <p className="text-amber-400/80 text-sm font-semibold">Select a zone to see available orders</p>
              <button
                onClick={() => setShowZonePicker(true)}
                className="mt-3 text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2"
              >
                Choose your delivery zone →
              </button>
            </div>
          ) : claimable.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center">
              <Truck size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">{claimableMsg || 'No orders in your zone right now. Check back soon!'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {claimable.map((order) => {
                const customer = (order as any).customerId as { name?: string; phone?: string } | null;
                return (
                  <div key={order._id} className="glass rounded-2xl p-4 border border-purple-500/20">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-sm text-purple-300">{order.orderId}</span>
                        {/* Route */}
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-300">
                          <span>{(order as any).pickup?.city}</span>
                          <ArrowRight size={12} className="text-slate-500 shrink-0" />
                          <span className="font-semibold text-white">{(order as any).drop?.city}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          📍 {(order as any).drop?.address} — {(order as any).drop?.pincode}
                        </p>
                        {/* Customer info */}
                        {customer?.name && (
                          <div className="mt-2 flex items-center gap-3 text-xs">
                            <span className="text-slate-400">👤 {customer.name}</span>
                            {customer.phone && (
                              <span className="text-slate-500">📞 {customer.phone}</span>
                            )}
                          </div>
                        )}
                        {/* Weight + amount */}
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                          <span>{order.package?.chargeableWeight} kg</span>
                          <span className="text-emerald-400 font-semibold">{formatCurrency(order.pricing?.totalCharge)}</span>
                          <span className="capitalize">{order.paymentType}</span>
                        </div>
                      </div>
                      <Button
                        id={`claim-btn-${order._id}`}
                        size="sm"
                        loading={claimingId === order._id}
                        onClick={() => claimOrder(order._id)}
                        icon={<Truck size={14} />}
                      >
                        Claim
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Location Update */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <GlassCard hover={false}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
                  <MapPin size={20} className="text-sky-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Location Update</p>
                  <p className="text-xs text-slate-400">Share your current position</p>
                </div>
              </div>
              <Button size="sm" variant="secondary" loading={locationLoading} icon={<Wifi size={14} />} onClick={updateLocation}>
                Update Location
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Assigned Orders */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-lg">Assigned Orders</h3>
            <Button size="sm" variant="ghost" onClick={() => navigate('/agent/orders')}>View All</Button>
          </div>
          {loading ? <SkeletonList count={3} /> : orders.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <Package size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No assigned orders yet</p>
            </div>
          ) : orders.slice(0, 5).map((order) => (
            <div key={order._id} onClick={() => navigate(`/agent/orders/${order._id}`)} className="glass rounded-2xl p-4 mb-3 cursor-pointer hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <span className="font-mono text-sm text-emerald-400">{order.orderId}</span>
                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-300">
                    <span>{(order as any).pickup?.city}</span>
                    <span className="text-slate-500">→</span>
                    <span>{(order as any).drop?.city}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{formatDate(order.createdAt)}</p>
                </div>
                <StatusBadge status={order.status as any} />
              </div>
            </div>
          ))}
        </motion.div>

      </div>

      {/* Zone Picker Modal */}
      <AnimatePresence>
        {showZonePicker && (
          <ZonePicker
            zones={zones}
            currentZoneId={hasZone ? (currentZone as any)._id : null}
            onSelect={selectZone}
            onClose={() => setShowZonePicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
