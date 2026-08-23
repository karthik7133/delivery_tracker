import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { toast } from 'react-hot-toast';
import { MapPin, Package, CreditCard, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import * as THREE from 'three';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import GlassCard from '../../components/ui/GlassCard';
import { ordersApi } from '../../api/orders';
import { formatCurrency, getAxiosError } from '../../utils';
import type { OrderType, PaymentType, QuoteRequest } from '../../types';

// Animated 3D box that scales with dimensions
function DynamicBox({ l, w, h }: { l: number; w: number; h: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    meshRef.current.rotation.y += delta * 0.5;
    meshRef.current.rotation.x = 0.3;
  });
  const maxD = Math.max(l, w, h, 1);
  return (
    <mesh ref={meshRef} scale={[l / maxD, h / maxD, w / maxD]}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.3} roughness={0.2} metalness={0.7} transparent opacity={0.9} />
    </mesh>
  );
}

const steps = [
  { id: 1, label: 'Addresses', icon: MapPin },
  { id: 2, label: 'Package', icon: Package },
  { id: 3, label: 'Order Type', icon: CreditCard },
  { id: 4, label: 'Confirm', icon: CheckCircle2 },
];

interface FormData {
  pickup: { address: string; city: string; pincode: string };
  drop: { address: string; city: string; pincode: string };
  package: { length: number; breadth: number; height: number; actualWeight: number };
  orderType: OrderType;
  paymentType: PaymentType;
}

const defaultForm: FormData = {
  pickup: { address: '', city: '', pincode: '' },
  drop: { address: '', city: '', pincode: '' },
  package: { length: 10, breadth: 10, height: 10, actualWeight: 0.5 },
  orderType: 'B2C',
  paymentType: 'PREPAID',
};

export default function CreateOrderPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [quote, setQuote] = useState<{ baseCharge: number; codSurcharge: number; totalCharge: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const updateField = <K extends keyof FormData>(section: K, field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [section]: { ...(prev[section] as object), [field]: value } }));
  };

  const getQuote = async () => {
    setLoading(true);
    try {
      const payload: QuoteRequest = { ...form };
      const res = await ordersApi.quote(payload);
      setQuote(res.data.data.pricing);
      setStep(4);
    } catch (err) {
      toast.error(getAxiosError(err));
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async () => {
    setSubmitting(true);
    try {
      const res = await ordersApi.create(form);
      toast.success(`Order ${res.data.data.orderId} created!`);
      navigate('/customer/orders');
    } catch (err) {
      toast.error(getAxiosError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 3) getQuote();
    else setStep((s) => s + 1);
  };

  const volWeight = +(form.package.length * form.package.breadth * form.package.height / 5000).toFixed(2);
  const chargeableWeight = Math.max(form.package.actualWeight, volWeight);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => navigate('/customer/orders')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm">
            <ArrowLeft size={16} /> Back to orders
          </button>
          <h1 className="text-3xl font-black text-white">Create New Order</h1>
          <p className="text-slate-400 mt-1">Ship your package with ease</p>
        </motion.div>

        {/* Step Indicators */}
        <div className="flex items-center mb-8 glass rounded-2xl p-4">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  step >= s.id ? 'gradient-bg glow-emerald' : 'glass border border-white/10'
                }`}>
                  <s.icon size={18} className={step >= s.id ? 'text-white' : 'text-slate-500'} />
                </div>
                <span className={`text-xs mt-1 font-medium ${step >= s.id ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 rounded-full transition-all duration-500 ${step > s.id ? 'bg-emerald-500' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Addresses */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
              <GlassCard hover={false}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <h3 className="font-bold text-white">Pickup Address</h3>
                    </div>
                    <div className="space-y-4">
                      <Input label="Full address" value={form.pickup.address} onChange={(e) => updateField('pickup', 'address', e.target.value)} />
                      <Input label="City" value={form.pickup.city} onChange={(e) => updateField('pickup', 'city', e.target.value)} />
                      <Input label="Pincode" value={form.pickup.pincode} onChange={(e) => updateField('pickup', 'pincode', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-sky-400" />
                      <h3 className="font-bold text-white">Delivery Address</h3>
                    </div>
                    <div className="space-y-4">
                      <Input label="Full address" value={form.drop.address} onChange={(e) => updateField('drop', 'address', e.target.value)} />
                      <Input label="City" value={form.drop.city} onChange={(e) => updateField('drop', 'city', e.target.value)} />
                      <Input label="Pincode" value={form.drop.pincode} onChange={(e) => updateField('drop', 'pincode', e.target.value)} />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 2: Package */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
              <GlassCard hover={false}>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-white">Package Dimensions</h3>
                    {[
                      { key: 'length', label: 'Length (cm)' },
                      { key: 'breadth', label: 'Breadth (cm)' },
                      { key: 'height', label: 'Height (cm)' },
                      { key: 'actualWeight', label: 'Actual Weight (kg)' },
                    ].map(({ key, label }) => (
                      <Input
                        key={key}
                        label={label}
                        type="number"
                        min="0"
                        step="0.1"
                        value={form.package[key as keyof typeof form.package]}
                        onChange={(e) => updateField('package', key, parseFloat(e.target.value) || 0)}
                      />
                    ))}
                    <div className="glass rounded-xl p-3 space-y-2 text-sm">
                      <div className="flex justify-between text-slate-400">
                        <span>Volumetric Weight</span><span className="text-white">{volWeight} kg</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Chargeable Weight</span><span className="text-emerald-400 font-semibold">{chargeableWeight} kg</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-slate-400 text-sm mb-4">Live 3D Preview</p>
                    <div className="w-48 h-48 rounded-2xl overflow-hidden glass">
                      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[5, 5, 5]} intensity={1} color="#10b981" />
                        <DynamicBox l={form.package.length} w={form.package.breadth} h={form.package.height} />
                      </Canvas>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{form.package.length}×{form.package.breadth}×{form.package.height} cm</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 3: Order Type */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
              <GlassCard hover={false} className="space-y-8">
                <div>
                  <h3 className="font-bold text-white mb-4">Order Type</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(['B2C', 'B2B'] as const).map((type) => (
                      <motion.button
                        key={type}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setForm((f) => ({ ...f, orderType: type }))}
                        className={`p-5 rounded-xl text-left border transition-all duration-200 ${
                          form.orderType === type
                            ? 'border-emerald-500 bg-emerald-500/15 glow-emerald'
                            : 'glass border-white/10 hover:border-white/20'
                        }`}
                      >
                        <p className="text-lg mb-1">{type === 'B2C' ? '👤' : '🏢'}</p>
                        <p className="font-bold text-white">{type}</p>
                        <p className="text-xs text-slate-400">{type === 'B2C' ? 'Business to Customer' : 'Business to Business'}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white mb-4">Payment Type</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {([
                      { type: 'PREPAID', icon: '💳', desc: 'Pay now' },
                      { type: 'COD', icon: '💵', desc: 'Cash on delivery' },
                    ] as const).map(({ type, icon, desc }) => (
                      <motion.button
                        key={type}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setForm((f) => ({ ...f, paymentType: type }))}
                        className={`p-5 rounded-xl text-left border transition-all duration-200 ${
                          form.paymentType === type
                            ? 'border-sky-500 bg-sky-500/15 glow-sky'
                            : 'glass border-white/10 hover:border-white/20'
                        }`}
                      >
                        <p className="text-lg mb-1">{icon}</p>
                        <p className="font-bold text-white">{type}</p>
                        <p className="text-xs text-slate-400">{desc}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 4: Quote Review */}
          {step === 4 && quote && (
            <motion.div key="step4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
              <GlassCard hover={false} className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-4 glow-emerald">
                    <CheckCircle2 size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white">Order Summary</h3>
                  <p className="text-slate-400 text-sm">Review your pricing before confirming</p>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Pickup', value: `${form.pickup.city} — ${form.pickup.pincode}` },
                    { label: 'Drop', value: `${form.drop.city} — ${form.drop.pincode}` },
                    { label: 'Order Type', value: form.orderType },
                    { label: 'Payment', value: form.paymentType },
                    { label: 'Weight', value: `${chargeableWeight} kg (chargeable)` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-2 border-b border-white/5 text-sm">
                      <span className="text-slate-400">{label}</span>
                      <span className="text-white font-medium">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="glass rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Base Charge</span>
                    <span className="text-white">{formatCurrency(quote.baseCharge)}</span>
                  </div>
                  {quote.codSurcharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">COD Surcharge</span>
                      <span className="text-amber-400">{formatCurrency(quote.codSurcharge)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-white/10">
                    <span className="font-bold text-white">Total</span>
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="text-xl font-black gradient-text"
                    >
                      {formatCurrency(quote.totalCharge)}
                    </motion.span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-4 mt-6">
          {step > 1 && (
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)} icon={<ArrowLeft size={16} />}>
              Back
            </Button>
          )}
          <Button
            onClick={step === 4 ? createOrder : nextStep}
            loading={loading || submitting}
            className="flex-1"
            icon={<ChevronRight size={18} />}
          >
            {step === 4 ? 'Confirm & Create Order' : step === 3 ? 'Get Quote' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
