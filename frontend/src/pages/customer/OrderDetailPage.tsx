import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Package, CreditCard, Clock, Calendar,
  User, RefreshCw, Image, ShoppingBag, CheckCircle2, Truck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DayPicker } from 'react-day-picker';
import { ordersApi } from '../../api/orders';
import type { Order, TrackingEntry, OrderStatus } from '../../types';
import { PRODUCTS, FALLBACK_PRODUCT_IMAGE } from '../../data/products';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { formatCurrency, formatDate, getAxiosError } from '../../utils';

const STATUS_ICONS: Partial<Record<OrderStatus, string>> = {
  CREATED: '📋',
  ASSIGNED: '👤',
  PICKED_UP: '📦',
  IN_TRANSIT: '🚚',
  OUT_FOR_DELIVERY: '🏠',
  DELIVERED: '✅',
  FAILED: '❌',
  CANCELLED: '🚫',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<TrackingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchOrderData = () => {
      Promise.all([ordersApi.get(id), ordersApi.tracking(id)])
        .then(([orderRes, trackingRes]) => {
          setOrder(orderRes.data.data);
          setTracking(trackingRes.data.data.tracking);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    fetchOrderData();
    const interval = setInterval(fetchOrderData, 4000);
    return () => clearInterval(interval);
  }, [id]);

  const handleReschedule = async () => {
    if (!selectedDate || !id) return;
    setRescheduling(true);
    try {
      await ordersApi.reschedule(id, selectedDate.toISOString());
      toast.success('Delivery rescheduled!');
      setRescheduleOpen(false);
    } catch (err) {
      toast.error(getAxiosError(err));
    } finally {
      setRescheduling(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen py-8 px-4 max-w-4xl mx-auto space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );

  if (!order)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <p className="text-slate-400">Order not found</p>
        <Button onClick={() => navigate('/customer/orders')} icon={<ArrowLeft size={16} />}>
          Back to Orders
        </Button>
      </div>
    );

  // Determine order item image(s) or fallback
  const displayItems =
    order.items && order.items.length > 0
      ? order.items
      : [
          {
            productId: 'default',
            name: `${order.orderType} Express Shipment Package`,
            image: order.orderImage || PRODUCTS[0]?.image || FALLBACK_PRODUCT_IMAGE,
            price: order.pricing.totalCharge,
            quantity: 1,
            category: order.orderType,
          },
        ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back navigation */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => navigate('/customer/orders')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
        >
          <ArrowLeft size={16} /> Back to My Orders
        </motion.button>

        {/* Header summary card */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard hover={false} className="p-6 border border-white/15">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">
                  ORDER REFERENCE ID
                </p>
                <h1 className="text-3xl font-black font-mono text-emerald-400">
                  {order.orderId}
                </h1>
                <p className="text-slate-400 text-xs mt-1 flex items-center gap-1">
                  <Calendar size={12} /> Placed on {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status as OrderStatus} />
                {order.status === 'FAILED' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RefreshCw size={14} />}
                    onClick={() => setRescheduleOpen(true)}
                  >
                    Reschedule
                  </Button>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ── Order Items & Images Card ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <GlassCard hover={false} className="space-y-4">
            <h3 className="font-extrabold text-white text-lg flex items-center gap-2 border-b border-white/10 pb-3">
              <ShoppingBag size={20} className="text-emerald-400" />
              Order Items ({displayItems.length})
            </h3>
            <div className="divide-y divide-white/10">
              {displayItems.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center gap-4">
                  <img
                    src={item.image || FALLBACK_PRODUCT_IMAGE}
                    alt={item.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                    }}
                    className="w-20 h-20 object-cover rounded-2xl glass border border-white/15 shadow-md flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    {item.category && (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                        {item.category}
                      </span>
                    )}
                    <h4 className="text-sm font-bold text-white line-clamp-2">{item.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Quantity: <span className="text-white font-bold">{item.quantity}</span> × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-black text-white">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* ── Route & Pricing Grid ── */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Addresses Card */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <GlassCard hover={false} className="h-full">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-base">
                <MapPin size={18} className="text-emerald-400" /> Delivery Route
              </h3>
              <div className="space-y-4">
                <div className="p-3.5 glass rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-xs text-emerald-400 font-bold mb-1 uppercase tracking-wider">PICKUP LOCATION</p>
                  <p className="text-white text-sm font-medium">{order.pickup.address}</p>
                  <p className="text-slate-400 text-xs mt-1 font-mono">{order.pickup.city} — {order.pickup.pincode}</p>
                </div>
                <div className="p-3.5 glass rounded-xl border border-sky-500/20 bg-sky-500/5">
                  <p className="text-xs text-sky-400 font-bold mb-1 uppercase tracking-wider">DESTINATION DROP</p>
                  <p className="text-white text-sm font-medium">{order.drop.address}</p>
                  <p className="text-slate-400 text-xs mt-1 font-mono">{order.drop.city} — {order.drop.pincode}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Package & Pricing Card */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <GlassCard hover={false} className="h-full">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-base">
                <Package size={18} className="text-sky-400" /> Package & Pricing
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Dimensions', value: `${order.package.length}×${order.package.breadth}×${order.package.height} cm` },
                  { label: 'Actual Weight', value: `${order.package.actualWeight} kg` },
                  { label: 'Chargeable Weight', value: `${order.package.chargeableWeight} kg` },
                  { label: 'Payment Mode', value: `${order.orderType} · ${order.paymentType}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-1 border-b border-white/5 text-xs">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-white font-medium">{value}</span>
                  </div>
                ))}
                <div className="pt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Subtotal / Base Charge</span>
                    <span className="text-white">{formatCurrency(order.pricing.baseCharge)}</span>
                  </div>
                  {order.pricing.codSurcharge > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">COD Surcharge</span>
                      <span className="text-amber-400">{formatCurrency(order.pricing.codSurcharge)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-white/10 items-baseline">
                    <span className="font-bold text-white">Total Amount Paid</span>
                    <span className="text-xl font-black gradient-text">
                      {formatCurrency(order.pricing.totalCharge)}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Proof of delivery image if available */}
        {order.proofUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <GlassCard hover={false}>
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Image size={18} className="text-emerald-400" /> Delivery Proof Photo
              </h3>
              <img src={order.proofUrl} alt="Delivery proof" className="w-full max-h-72 object-cover rounded-2xl glass border border-white/15" />
            </GlassCard>
          </motion.div>
        )}

        {/* Tracking Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <GlassCard hover={false}>
            <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
              <Clock size={18} className="text-sky-400" /> Live Tracking History
            </h3>
            {tracking.length === 0 ? (
              <p className="text-slate-400 text-sm">No tracking updates logged yet</p>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-sky-500/30 to-transparent" />
                <div className="space-y-6">
                  {tracking.map((entry, i) => (
                    <motion.div
                      key={entry._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="flex gap-4 pl-2"
                    >
                      <div className="relative z-10 w-8 h-8 rounded-full glass border border-emerald-500/50 flex items-center justify-center text-sm flex-shrink-0 shadow-md">
                        {STATUS_ICONS[entry.status as OrderStatus] ?? '📍'}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={entry.status as OrderStatus} />
                          {entry.actorRole && (
                            <span className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
                              <User size={10} /> {entry.actorRole}
                            </span>
                          )}
                        </div>
                        {entry.note && <p className="text-sm text-slate-200 mt-1">{entry.note}</p>}
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Calendar size={10} /> {formatDate(entry.timestamp || entry.createdAt || '')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Reschedule Modal */}
        <Modal open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} title="Reschedule Delivery">
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">Select a new delivery date for your order:</p>
            <div className="flex justify-center">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={{ before: new Date() }}
              />
            </div>
            <Button
              onClick={handleReschedule}
              loading={rescheduling}
              className="w-full"
              disabled={!selectedDate}
              icon={<CreditCard size={16} />}
            >
              Confirm Reschedule
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
