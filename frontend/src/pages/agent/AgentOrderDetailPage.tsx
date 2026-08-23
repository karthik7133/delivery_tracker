import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft, MapPin, Package, Send, CheckCircle2,
  Upload, X, Image, User, Phone, Mail, ShoppingBag,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { agentApi } from '../../api/agent';
import type { Order, OrderStatus } from '../../types';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { formatCurrency, formatDate, getAxiosError, agentStatusTransitions, getStatusLabel } from '../../utils';

export default function AgentOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = () => {
      agentApi.getOrder(id)
        .then((res) => { setOrder(res.data.data); })
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    fetchDetail();
    const interval = setInterval(fetchDetail, 4000);
    return () => clearInterval(interval);
  }, [id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: (files) => {
      const file = files[0];
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    },
  });

  const updateStatus = async () => {
    if (!newStatus || !id) return;
    setUpdating(true);
    try {
      const res = await agentApi.updateOrderStatus(id, newStatus, note);
      setOrder(res.data.data);
      setSuccess(true);
      setNewStatus('');
      setNote('');
      toast.success(`Status updated to ${getStatusLabel(newStatus)}`);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      toast.error(getAxiosError(err));
    } finally {
      setUpdating(false);
    }
  };

  const uploadProof = async () => {
    if (!proofFile || !id) return;
    setUploading(true);
    try {
      const res = await agentApi.uploadProof(id, proofFile, setUploadProgress);
      toast.success('Delivery proof uploaded!');
      setOrder((prev) => prev ? { ...prev, proofUrl: res.data.data.proofUrl } : prev);
      setProofFile(null);
      setProofPreview(null);
      setUploadProgress(0);
    } catch (err) {
      toast.error(getAxiosError(err));
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen py-8 px-4 max-w-3xl mx-auto space-y-4">
      <SkeletonCard /><SkeletonCard /><SkeletonCard />
    </div>
  );
  if (!order) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400">Order not found</p>
    </div>
  );

  const validNextStatuses = agentStatusTransitions[order.status as OrderStatus] ?? [];
  const customer = (order as any).customerId as { name?: string; email?: string; phone?: string } | null;
  const hasItems = Array.isArray((order as any).items) && (order as any).items.length > 0;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        <button onClick={() => navigate('/agent/orders')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={16} /> Back to orders
        </button>

        {/* Header */}
        <GlassCard hover={false}>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-slate-400 text-sm">Order ID</p>
              <h1 className="text-2xl font-black font-mono text-emerald-400">{order.orderId}</h1>
              <p className="text-xs text-slate-500 mt-1">{formatDate(order.createdAt)}</p>
            </div>
            <StatusBadge status={order.status as OrderStatus} />
          </div>
          {/* Payment + Type quick info */}
          <div className="mt-4 flex flex-wrap gap-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              order.paymentType === 'COD'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              {order.paymentType}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full border bg-sky-500/10 border-sky-500/30 text-sky-300">
              {order.orderType}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full border bg-white/5 border-white/10 text-white ml-auto">
              {formatCurrency(order.pricing.totalCharge)}
            </span>
          </div>
        </GlassCard>

        {/* ── Customer Details ── */}
        {customer && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard hover={false}>
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <User size={16} className="text-purple-400" /> Customer Details
              </h3>
              <div className="space-y-3">
                {customer.name && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 glass rounded-xl flex items-center justify-center shrink-0">
                      <User size={15} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Customer Name</p>
                      <p className="text-white font-semibold text-sm">{customer.name}</p>
                    </div>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 glass rounded-xl flex items-center justify-center shrink-0">
                      <Phone size={15} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Phone Number</p>
                      <a href={`tel:${customer.phone}`} className="text-emerald-400 font-semibold text-sm hover:underline">
                        {customer.phone}
                      </a>
                    </div>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 glass rounded-xl flex items-center justify-center shrink-0">
                      <Mail size={15} className="text-sky-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Email Address</p>
                      <a href={`mailto:${customer.email}`} className="text-sky-400 font-semibold text-sm hover:underline">
                        {customer.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Route */}
        <GlassCard hover={false}>
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-emerald-400" /> Route
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 glass rounded-xl">
              <p className="text-xs text-emerald-400 font-semibold mb-1">PICKUP</p>
              <p className="text-white text-sm">{order.pickup.address}</p>
              <p className="text-slate-400 text-xs">{order.pickup.city} — {order.pickup.pincode}</p>
            </div>
            <div className="p-3 glass rounded-xl">
              <p className="text-xs text-sky-400 font-semibold mb-1">DELIVERY</p>
              <p className="text-white text-sm">{order.drop.address}</p>
              <p className="text-slate-400 text-xs">{order.drop.city} — {order.drop.pincode}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-400">Weight:</span> <span className="text-white ml-1">{order.package.chargeableWeight} kg</span></div>
            <div><span className="text-slate-400">Attempt:</span> <span className="text-white ml-1">#{order.deliveryAttempt}</span></div>
          </div>
        </GlassCard>

        {/* Order Items */}
        {hasItems && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard hover={false}>
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <ShoppingBag size={16} className="text-amber-400" /> Order Items
              </h3>
              <div className="space-y-3">
                {(order as any).items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 glass rounded-xl p-3">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Package size={20} className="text-slate-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                      {item.category && <p className="text-xs text-slate-500">{item.category}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-emerald-400 font-bold text-sm">{formatCurrency(item.price)}</p>
                      <p className="text-xs text-slate-500">×{item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-sm">
                <span className="text-slate-400">Total Charge</span>
                <span className="text-emerald-400 font-black">{formatCurrency(order.pricing.totalCharge)}</span>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Status Update */}
        {validNextStatuses.length > 0 && (
          <GlassCard hover={false}>
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Send size={16} className="text-sky-400" /> Update Status</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {validNextStatuses.map((s) => (
                <motion.button
                  key={s}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setNewStatus(s)}
                  className={`p-3 rounded-xl text-sm font-semibold border transition-all ${
                    newStatus === s
                      ? 'gradient-bg text-white border-emerald-500'
                      : 'glass border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  {getStatusLabel(s)}
                </motion.button>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)..."
              rows={2}
              className="w-full glass rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none mb-4"
            />
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-3 py-3 text-emerald-400"
                >
                  <CheckCircle2 size={24} />
                  <span className="font-semibold">Status Updated!</span>
                </motion.div>
              ) : (
                <Button key="btn" onClick={updateStatus} loading={updating} disabled={!newStatus} className="w-full" icon={<Send size={16} />}>
                  Update Status
                </Button>
              )}
            </AnimatePresence>
          </GlassCard>
        )}

        {/* Proof Upload */}
        <GlassCard hover={false}>
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Upload size={16} className="text-sky-400" /> Delivery Proof</h3>
          {order.proofUrl ? (
            <div>
              <img src={order.proofUrl} alt="Proof" className="w-full max-h-64 object-cover rounded-xl" />
              <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><CheckCircle2 size={12} /> Proof uploaded</p>
            </div>
          ) : (
            <>
              {proofPreview ? (
                <div className="relative">
                  <img src={proofPreview} alt="Preview" className="w-full max-h-48 object-cover rounded-xl" />
                  <button onClick={() => { setProofFile(null); setProofPreview(null); }} className="absolute top-2 right-2 p-1 bg-black/60 rounded-lg">
                    <X size={16} className="text-white" />
                  </button>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Image size={32} className="text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">{isDragActive ? 'Drop the photo here' : 'Drag & drop a photo, or click to browse'}</p>
                </div>
              )}

              {proofFile && (
                <div className="mt-4 space-y-3">
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="glass rounded-full overflow-hidden h-2">
                      <motion.div animate={{ width: `${uploadProgress}%` }} className="h-full gradient-bg" />
                    </div>
                  )}
                  <Button onClick={uploadProof} loading={uploading} className="w-full" icon={<Upload size={16} />}>
                    Upload Proof
                  </Button>
                </div>
              )}
            </>
          )}
        </GlassCard>

      </div>
    </div>
  );
}
