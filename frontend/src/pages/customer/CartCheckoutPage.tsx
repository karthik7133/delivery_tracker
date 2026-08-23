import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ShoppingBag, Trash2, Plus, Minus, Tag, ShieldCheck,
  MapPin, CreditCard, ArrowLeft, ArrowRight, CheckCircle2,
  Lock, Sparkles, Check, AlertTriangle, Pencil,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { ordersApi } from '../../api/orders';
import { formatCurrency, getAxiosError } from '../../utils';
import type { OrderType, PaymentType, CreateOrderRequest, Order } from '../../types';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

export default function CartCheckoutPage() {
  const navigate = useNavigate();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    discount,
    totalAmount,
    totalItems,
    promoCode,
    applyPromoCode,
    removePromoCode,
    savedAddresses,
    selectedAddress,
    setSelectedAddress,
    addSavedAddress,
    updateSavedAddress,
    deleteSavedAddress,
  } = useCart();

  const [inputPromo, setInputPromo] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('PREPAID');
  const [orderType, setOrderType] = useState<OrderType>('B2C');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [addAddrModalOpen, setAddAddrModalOpen] = useState(false);

  // Online Card details state
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [payingCard, setPayingCard] = useState(false);

  // Order Success Popup state
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  // New address form
  const [newAddr, setNewAddr] = useState({ name: '', phone: '', address: '', city: '', pincode: '' });
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Pincode deliverability
  const [deliverable, setDeliverable] = useState<{ deliverable: boolean; zone?: { name: string }; message: string } | null>(null);
  const [deliverabilityChecking, setDeliverabilityChecking] = useState(false);

  const checkPincode = async (pincode: string) => {
    if (!pincode || pincode.length < 6) { setDeliverable(null); return; }
    setDeliverabilityChecking(true);
    try {
      const res = await ordersApi.checkPincode(pincode);
      setDeliverable(res.data.data);
    } catch { setDeliverable(null); }
    finally { setDeliverabilityChecking(false); }
  };

  // Check pincode whenever selected address changes
  useEffect(() => {
    if (selectedAddress?.pincode) checkPincode(selectedAddress.pincode);
    else setDeliverable(null);
  }, [selectedAddress]);


  // Default pickup warehouse
  const pickupWarehouse = {
    address: 'Central E-Commerce Fulfillment Hub, Plot 12, Industrial Expressway',
    city: 'Guntur',
    pincode: '522001',
  };

  const handleApplyPromo = () => {
    if (!inputPromo.trim()) return;
    const ok = applyPromoCode(inputPromo);
    if (ok) toast.success('Promo code SWIFT10 applied! 10% discount added.');
    else toast.error('Invalid promo code. Try SWIFT10');
  };

  const handleCreateNewAddress = () => {
    if (!newAddr.address || !newAddr.city || !newAddr.pincode) {
      toast.error('Please fill in address, city, and pincode');
      return;
    }
    if (editingAddrId) {
      updateSavedAddress(editingAddrId, newAddr);
      toast.success('Address updated!');
    } else {
      addSavedAddress(newAddr);
      toast.success('New address added!');
    }
    setAddAddrModalOpen(false);
    setEditingAddrId(null);
    setNewAddr({ name: '', phone: '', address: '', city: '', pincode: '' });
  };

  const openEdit = (addr: typeof savedAddresses[0]) => {
    setEditingAddrId(addr.id);
    setNewAddr({ name: addr.name, phone: addr.phone, address: addr.address, city: addr.city, pincode: addr.pincode });
    setAddAddrModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteSavedAddress(id);
    setDeleteConfirmId(null);
  };

  const handleInitiatePlaceOrder = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    if (!selectedAddress) {
      toast.error('Please select or add a delivery address');
      return;
    }
    // Only block if the pincode is confirmed NOT in any zone (deliverable === false)
    // Agent availability is NOT a hard block — orders can still be placed
    if (deliverable !== null && deliverable.deliverable === false) {
      toast.error(deliverable.message || 'Delivery not available to this pincode');
      return;
    }

    if (paymentType === 'PREPAID') {
      setCardModalOpen(true);
    } else {
      executeOrderCreation();
    }
  };


  const executeOrderCreation = async () => {
    setPlacingOrder(true);
    try {
      const totalWeight = +cart
        .reduce((sum, item) => sum + item.product.weight * item.quantity, 0)
        .toFixed(2);

      const maxLen = Math.max(...cart.map((item) => item.product.dimensions.length));
      const maxBrd = Math.max(...cart.map((item) => item.product.dimensions.breadth));
      const sumHgt = cart.reduce(
        (sum, item) => sum + item.product.dimensions.height * item.quantity,
        0
      );

      const itemsPayload = cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        image: item.product.image,
        price: item.product.price,
        quantity: item.quantity,
        category: item.product.category,
      }));

      const payload: CreateOrderRequest = {
        pickup: pickupWarehouse,
        drop: {
          address: selectedAddress!.address,
          city: selectedAddress!.city,
          pincode: selectedAddress!.pincode,
        },
        package: {
          length: Math.max(maxLen, 10),
          breadth: Math.max(maxBrd, 10),
          height: Math.max(sumHgt, 5),
          actualWeight: Math.max(totalWeight, 0.5),
        },
        orderType,
        paymentType,
        totalAmount, // Cart payable price!
        items: itemsPayload,
        orderImage: cart[0]?.product.image,
      };

      const res = await ordersApi.create(payload);
      const createdOrder = res.data.data;
      clearCart();
      setCardModalOpen(false);
      setSuccessOrder(createdOrder);
    } catch (err) {
      toast.error(getAxiosError(err));
    } finally {
      setPlacingOrder(false);
      setPayingCard(false);
    }
  };

  const handleCardPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || cardNumber.length < 12) {
      toast.error('Please enter a valid card number');
      return;
    }
    if (!cardHolder) {
      toast.error('Please enter cardholder name');
      return;
    }
    if (!cardExpiry || !cardCvv) {
      toast.error('Please enter expiry date and CVV');
      return;
    }

    setPayingCard(true);
    await executeOrderCreation();
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  if (cart.length === 0 && !successOrder) {
    return (
      <div className="min-h-screen py-16 px-4 text-center max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-24 h-24 glass rounded-full flex items-center justify-center mx-auto mb-6 float-animation">
            <ShoppingBag size={48} className="text-slate-500" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Your Cart is Empty</h2>
          <p className="text-slate-400 text-sm mb-6">
            Looks like you haven't added any products to your shopping cart yet.
          </p>
          <Button
            size="lg"
            variant="primary"
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate('/customer')}
          >
            Start Shopping
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/customer')}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors mb-2"
          >
            <ArrowLeft size={16} /> Back to Shop
          </button>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <ShoppingBag size={28} className="text-emerald-400" /> Shopping Cart & Checkout
          </h1>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold glass px-3 py-1.5 rounded-lg"
          >
            <Trash2 size={14} /> Clear Cart
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Cart Items & Addresses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cart Items List */}
          <GlassCard hover={false} className="space-y-4">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              Cart Items ({totalItems})
            </h3>
            <div className="divide-y divide-white/10">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="py-4 flex gap-4 items-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-xl glass flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-emerald-400 font-semibold">{product.category}</p>
                    <h4 className="text-sm font-bold text-white truncate">{product.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Seller: {product.seller}</p>
                    <p className="text-sm font-black text-white mt-1">
                      {formatCurrency(product.price)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 glass rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="p-1 rounded-lg hover:bg-white/10 text-slate-300"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="p-1 rounded-lg hover:bg-white/10 text-slate-300"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Delivery Address Picker */}
          <GlassCard hover={false} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <MapPin size={18} className="text-emerald-400" /> Delivery Address
              </h3>
              <button
                onClick={() => setAddAddrModalOpen(true)}
                className="text-xs text-emerald-400 hover:underline font-semibold"
              >
                + Add New Address
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {savedAddresses.map((addr) => {
                const isSelected = selectedAddress?.id === addr.id;
                return (
                  <div key={addr.id} className={`relative p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 glow-emerald'
                      : 'glass border-white/10'
                  }`}>
                    {/* Select on click (excluding action buttons) */}
                    <div className="cursor-pointer" onClick={() => setSelectedAddress(addr)}>
                      <div className="flex items-center justify-between mb-2 pr-16">
                        <span className="font-bold text-white text-sm">{addr.name || 'Address'}</span>
                        {isSelected && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-300">{addr.address}</p>
                      <p className="text-xs text-slate-400 font-mono mt-1">{addr.city} — {addr.pincode}</p>
                      {addr.phone && <p className="text-xs text-slate-500 mt-1">📞 {addr.phone}</p>}
                    </div>
                    {/* Edit / Delete buttons */}
                    <div className="absolute top-3 right-3 flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(addr); }}
                        className="p-1.5 glass rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-all"
                        title="Edit"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(addr.id); }}
                        className="p-1.5 glass rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Deliverability banner */}
            {selectedAddress && (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                deliverabilityChecking
                  ? 'bg-white/5 text-slate-400'
                  : deliverable === null
                  ? ''
                  : deliverable.deliverable && (deliverable as any).agentAvailable
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : deliverable.deliverable
                  ? 'bg-sky-500/10 border border-sky-500/30 text-sky-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300'
              }`}>
                {deliverabilityChecking ? (
                  <><span className="animate-spin">⏳</span> Checking delivery availability...</>
                ) : deliverable === null ? null
                  : deliverable.deliverable && (deliverable as any).agentAvailable ? (
                  <><CheckCircle2 size={16} className="shrink-0 text-emerald-400" /> {deliverable.message} {deliverable.zone && `(${deliverable.zone.name})`}</>
                ) : deliverable.deliverable ? (
                  <><CheckCircle2 size={16} className="shrink-0 text-sky-400" /> {deliverable.message} {deliverable.zone && `(${deliverable.zone.name})`}</>
                ) : (
                  <><AlertTriangle size={16} className="shrink-0 text-red-400" /> {deliverable.message}</>
                )}
              </div>
            )}

          </GlassCard>

          {/* Payment Method */}
          <GlassCard hover={false} className="space-y-4">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <CreditCard size={18} className="text-sky-400" /> Payment Option
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {([
                { type: 'PREPAID', label: 'Online Payment (Prepaid)', desc: 'Credit / Debit Card / UPI' },
                { type: 'COD', label: 'Cash on Delivery (COD)', desc: 'Pay cash when delivered' },
              ] as const).map((mode) => (
                <button
                  key={mode.type}
                  onClick={() => setPaymentType(mode.type)}
                  className={`p-4 rounded-2xl text-left border transition-all ${
                    paymentType === mode.type
                      ? 'border-sky-500 bg-sky-500/15 glow-sky'
                      : 'glass border-white/10 hover:border-white/20'
                  }`}
                >
                  <p className="font-bold text-white text-sm">{mode.label}</p>
                  <p className="text-xs text-slate-400 mt-1">{mode.desc}</p>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right Col: Price Breakdown & Place Order */}
        <div className="space-y-6">
          {/* Promo Code Card */}
          <GlassCard hover={false} className="space-y-3">
            <p className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Tag size={14} className="text-yellow-400" /> Promo Code
            </p>
            {promoCode ? (
              <div className="flex items-center justify-between glass rounded-xl p-3 border border-emerald-500/30">
                <div>
                  <p className="text-xs text-emerald-400 font-bold">{promoCode} APPLIED</p>
                  <p className="text-xs text-slate-400">10% Extra Discount Saved</p>
                </div>
                <button onClick={removePromoCode} className="text-xs text-red-400 hover:underline font-bold">
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Try SWIFT10"
                  value={inputPromo}
                  onChange={(e) => setInputPromo(e.target.value)}
                  className="flex-1 glass rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 uppercase"
                />
                <button
                  onClick={handleApplyPromo}
                  className="px-4 py-2 rounded-xl text-xs font-bold gradient-bg text-white hover:opacity-90"
                >
                  Apply
                </button>
              </div>
            )}
          </GlassCard>

          {/* Price Breakdown Card */}
          <GlassCard hover={false} className="space-y-4">
            <h3 className="font-bold text-white text-lg border-b border-white/10 pb-3">
              Price Details
            </h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Price ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
                <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Festive Discount</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-300">
                <span>Express Zone Delivery</span>
                <span className="text-emerald-400 font-bold">FREE</span>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                <span className="font-extrabold text-white text-base">Total Payable</span>
                <span className="text-2xl font-black gradient-text">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            <Button
              size="lg"
              variant="primary"
              className="w-full mt-4"
              loading={placingOrder}
              icon={<ArrowRight size={18} />}
              onClick={handleInitiatePlaceOrder}
            >
              Place Order
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Safe & Secure Logistics Guaranteed</span>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Online Card Payment Modal */}
      <Modal open={cardModalOpen} onClose={() => setCardModalOpen(false)} title="🔒 Online Card Payment Gateway">
        <form onSubmit={handleCardPaymentSubmit} className="space-y-4">
          <div className="glass rounded-xl p-4 border border-sky-500/30 bg-sky-500/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-sky-400 font-bold uppercase">PAYABLE AMOUNT</p>
              <p className="text-2xl font-black text-white">{formatCurrency(totalAmount)}</p>
            </div>
            <Lock size={24} className="text-sky-400" />
          </div>

          <Input
            label="Card Number"
            placeholder="4532 1234 5678 8910"
            maxLength={19}
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          />

          <Input
            label="Cardholder Name"
            placeholder="Karthik Kumar"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Expiry (MM/YY)"
              placeholder="12/28"
              maxLength={5}
              value={cardExpiry}
              onChange={(e) => setCardExpiry(e.target.value)}
            />
            <Input
              label="CVV"
              placeholder="123"
              type="password"
              maxLength={3}
              value={cardCvv}
              onChange={(e) => setCardCvv(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCardModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={payingCard || placingOrder} className="flex-1">
              Pay {formatCurrency(totalAmount)}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Order Placed & Payment Successful Card Info Popup */}
      {successOrder && (
        <Modal open={true} onClose={() => {}} title="🎉 Order Placed Successfully!">
          <div className="text-center space-y-4 py-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto glow-emerald shadow-2xl"
            >
              <CheckCircle2 size={44} className="text-white" />
            </motion.div>

            <div>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">
                PAYMENT CONFIRMED
              </p>
              <h2 className="text-2xl font-black font-mono text-white mt-1">
                {successOrder.orderId}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Ref ID: TXN-{Math.random().toString(36).substring(2, 10).toUpperCase()}
              </p>
            </div>

            <div className="glass rounded-2xl p-4 space-y-2 text-xs text-left">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Total Paid:</span>
                <span className="text-emerald-400 font-extrabold text-sm">
                  {formatCurrency(successOrder.pricing.totalCharge)}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Delivery Address:</span>
                <span className="text-white font-medium truncate max-w-[200px]">
                  {successOrder.drop.address}, {successOrder.drop.city}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold uppercase">ORDER CREATED</span>
              </div>
            </div>

            <Button
              size="lg"
              variant="primary"
              className="w-full"
              icon={<ArrowRight size={18} />}
              onClick={() => {
                const orderId = successOrder._id;
                setSuccessOrder(null);
                navigate(`/customer/orders/${orderId}`);
              }}
            >
              Track Order Shipment
            </Button>
          </div>
        </Modal>
      )}

      <Modal
        open={addAddrModalOpen}
        onClose={() => { setAddAddrModalOpen(false); setEditingAddrId(null); setNewAddr({ name: '', phone: '', address: '', city: '', pincode: '' }); }}
        title={editingAddrId ? 'Edit Address' : 'Add Delivery Address'}
      >
        <div className="space-y-4">
          <Input
            label="Full Name / Label"
            placeholder="e.g. Home, Office"
            value={newAddr.name}
            onChange={(e) => setNewAddr((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Phone Number"
            type="tel"
            value={newAddr.phone}
            onChange={(e) => setNewAddr((f) => ({ ...f, phone: e.target.value }))}
          />
          <Input
            label="Street Address / Door No."
            value={newAddr.address}
            onChange={(e) => setNewAddr((f) => ({ ...f, address: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={newAddr.city}
              onChange={(e) => setNewAddr((f) => ({ ...f, city: e.target.value }))}
            />
            <Input
              label="Pincode"
              maxLength={6}
              value={newAddr.pincode}
              onChange={(e) => setNewAddr((f) => ({ ...f, pincode: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setAddAddrModalOpen(false); setEditingAddrId(null); }} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateNewAddress} icon={editingAddrId ? <Pencil size={14} /> : <Plus size={14} />} className="flex-1">
              {editingAddrId ? 'Save Changes' : 'Add Address'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-sm glass-strong rounded-3xl p-6 border border-white/10 text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <Trash2 size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Delete Address?</h3>
              <p className="text-sm text-slate-400 mb-6">
                {savedAddresses.find((a) => a.id === deleteConfirmId)?.name || 'This address'} will be permanently removed.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirmId(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 !bg-red-600 hover:!bg-red-500"
                  onClick={() => handleDelete(deleteConfirmId)}
                  icon={<Trash2 size={14} />}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
