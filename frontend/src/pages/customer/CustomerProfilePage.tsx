import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, MapPin, Package, Heart, ShoppingBag, Plus, Trash2,
  ShieldCheck, Mail, Phone, Pencil, Star, Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import type { SavedAddress } from '../../context/CartContext';
import { ordersApi } from '../../api/orders';
import { PRODUCTS } from '../../data/products';
import { formatCurrency, formatDateOnly } from '../../utils';
import type { Order } from '../../types';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

const emptyForm = { name: '', phone: '', address: '', city: '', pincode: '' };

export default function CustomerProfilePage() {
  const { user } = useAuth();
  const {
    wishlist, toggleWishlist, addToCart,
    savedAddresses, addSavedAddress, updateSavedAddress, deleteSavedAddress,
    selectedAddress, setSelectedAddress,
  } = useCart();
  const navigate = useNavigate();

  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Modal state
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [editingAddr, setEditingAddr] = useState<SavedAddress | null>(null); // null = add mode
  const [form, setForm] = useState(emptyForm);

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    ordersApi.list()
      .then((res) => {
        const data = res.data.data as any;
        setMyOrders(Array.isArray(data) ? data : (data?.items ?? []));
      })
      .catch(console.error)
      .finally(() => setLoadingOrders(false));
  }, []);

  const wishlistProducts = PRODUCTS.filter((p) => wishlist.includes(p.id));
  const activeOrders = myOrders.filter((o) => !['DELIVERED', 'CANCELLED', 'FAILED'].includes(o.status));
  const deliveredOrders = myOrders.filter((o) => o.status === 'DELIVERED');

  // Open Add modal
  const openAdd = () => {
    setEditingAddr(null);
    setForm(emptyForm);
    setAddrModalOpen(true);
  };

  // Open Edit modal
  const openEdit = (addr: SavedAddress) => {
    setEditingAddr(addr);
    setForm({ name: addr.name, phone: addr.phone, address: addr.address, city: addr.city, pincode: addr.pincode });
    setAddrModalOpen(true);
  };

  // Save (add or update)
  const handleSave = () => {
    if (!form.address.trim() || !form.city.trim() || !form.pincode.trim()) return;
    if (editingAddr) {
      updateSavedAddress(editingAddr.id, { ...form, isDefault: editingAddr.isDefault });
    } else {
      addSavedAddress(form);
    }
    setAddrModalOpen(false);
    setForm(emptyForm);
    setEditingAddr(null);
  };

  // Delete
  const handleDelete = (id: string) => {
    deleteSavedAddress(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="min-h-screen py-8 px-4 max-w-6xl mx-auto space-y-8">

      {/* Header Profile Card */}
      <GlassCard hover={false} className="p-6 md:p-8">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="w-20 h-20 rounded-3xl gradient-bg flex items-center justify-center glow-emerald shadow-2xl">
            <User size={36} className="text-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white">{user?.name ?? 'Customer'}</h1>
              <span className="px-3 py-1 glass rounded-full text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {user?.role} ACCOUNT
              </span>
            </div>
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <Mail size={14} /> {user?.email}
            </p>
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <Phone size={14} /> {user?.phone ?? '—'}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Button variant="secondary" size="sm" icon={<ShoppingBag size={16} />} onClick={() => navigate('/customer')}>
              Shop Catalog
            </Button>
            <Button variant="primary" size="sm" icon={<Package size={16} />} onClick={() => navigate('/customer/orders')}>
              My Orders ({myOrders.length})
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: myOrders.length, icon: Package, color: 'text-sky-400' },
          { label: 'Active Shipments', value: activeOrders.length, icon: ShoppingBag, color: 'text-amber-400' },
          { label: 'Delivered', value: deliveredOrders.length, icon: ShieldCheck, color: 'text-emerald-400' },
          { label: 'Wishlist Items', value: wishlist.length, icon: Heart, color: 'text-red-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <GlassCard key={label} className="text-center p-4">
            <Icon size={24} className={`${color} mx-auto mb-2`} />
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
          </GlassCard>
        ))}
      </div>

      {/* ── Saved Addresses Section ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            <MapPin size={20} className="text-emerald-400" /> Saved Delivery Addresses
            <span className="text-sm font-normal text-slate-500 ml-1">({savedAddresses.length})</span>
          </h3>
          <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={openAdd}>
            Add Address
          </Button>
        </div>

        {savedAddresses.length === 0 ? (
          <GlassCard hover={false} className="text-center py-12">
            <MapPin size={36} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No saved addresses yet</p>
            <button onClick={openAdd} className="mt-3 text-emerald-400 hover:underline text-xs font-semibold">
              Add your first address →
            </button>
          </GlassCard>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {savedAddresses.map((addr) => {
              const isSelected = selectedAddress?.id === addr.id;
              return (
                <motion.div
                  key={addr.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <GlassCard
                    hover={false}
                    className={`p-5 relative group transition-all ${isSelected ? 'border border-emerald-500/40 bg-emerald-500/5' : ''}`}
                  >
                    {/* Default badge */}
                    {addr.isDefault && (
                      <span className="absolute top-3 right-3 px-2.5 py-0.5 glass rounded-full text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <Star size={10} fill="currentColor" /> DEFAULT
                      </span>
                    )}

                    {/* Name */}
                    <div className="flex items-center gap-2 mb-2 pr-20">
                      <p className="font-bold text-white text-base">{addr.name || 'Unnamed Address'}</p>
                      {isSelected && <Check size={14} className="text-emerald-400 shrink-0" />}
                    </div>

                    <p className="text-sm text-slate-300">{addr.address}</p>
                    <p className="text-xs text-slate-400 font-mono mt-1">{addr.city} — {addr.pincode}</p>
                    {addr.phone && <p className="text-xs text-slate-500 mt-1">📞 {addr.phone}</p>}

                    {/* Action row */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
                      {/* Select as delivery */}
                      {!isSelected && (
                        <button
                          onClick={() => setSelectedAddress(addr)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Check size={12} /> Use for Delivery
                        </button>
                      )}
                      {isSelected && (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <Check size={12} /> Selected for Delivery
                        </span>
                      )}

                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={() => openEdit(addr)}
                          className="p-1.5 glass rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-all"
                          title="Edit address"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(addr.id)}
                          className="p-1.5 glass rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Delete address"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Wishlist Section ── */}
      <div className="space-y-4">
        <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Heart size={20} className="text-red-400" /> Saved Wishlist ({wishlistProducts.length})
        </h3>
        {wishlistProducts.length === 0 ? (
          <GlassCard hover={false} className="text-center py-12">
            <Heart size={36} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Your wishlist is empty</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {wishlistProducts.map((product) => (
              <GlassCard key={product.id} className="p-4 flex gap-4 items-center">
                <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-xl glass flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{product.name}</h4>
                  <p className="text-xs font-black text-emerald-400 mt-0.5">{formatCurrency(product.price)}</p>
                  <button
                    onClick={() => { addToCart(product); toggleWishlist(product.id); }}
                    className="text-xs text-sky-400 hover:underline font-semibold mt-1 block"
                  >
                    Move to Cart
                  </button>
                </div>
                <button onClick={() => toggleWishlist(product.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                  <Trash2 size={16} />
                </button>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* ── Add / Edit Address Modal ── */}
      <Modal
        open={addrModalOpen}
        onClose={() => { setAddrModalOpen(false); setEditingAddr(null); setForm(emptyForm); }}
        title={editingAddr ? 'Edit Address' : 'Add New Address'}
      >
        <div className="space-y-4">
          <Input
            label="Label / Full Name"
            placeholder="e.g. Home, Office, Karthik's House"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="10-digit mobile number"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
          />
          <Input
            label="Street Address / Building"
            placeholder="House no., Street, Area"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              placeholder="e.g. Guntur"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
            <Input
              label="Pincode"
              maxLength={6}
              placeholder="6-digit pincode"
              value={form.pincode}
              onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => { setAddrModalOpen(false); setEditingAddr(null); setForm(emptyForm); }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!form.address.trim() || !form.city.trim() || !form.pincode.trim()}
              className="flex-1"
              icon={editingAddr ? <Pencil size={14} /> : <Plus size={14} />}
            >
              {editingAddr ? 'Save Changes' : 'Add Address'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
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
                  className="flex-1 !bg-red-600 hover:!bg-red-500 border-red-500"
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
