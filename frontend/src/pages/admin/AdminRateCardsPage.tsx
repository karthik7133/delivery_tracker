import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, CreditCard } from 'lucide-react';
import { adminApi } from '../../api/admin';
import type { RateCard, OrderType, RateType } from '../../types';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { formatCurrency, getAxiosError } from '../../utils';

interface RateCardForm {
  orderType: OrderType;
  rateType: RateType;
  minWeight: string;
  maxWeight: string;
  ratePerKg: string;
  baseCharge: string;
  codSurcharge: string;
  isActive: boolean;
}

const defaultForm: RateCardForm = {
  orderType: 'B2C', rateType: 'INTRA_ZONE',
  minWeight: '0', maxWeight: '5',
  ratePerKg: '10', baseCharge: '50', codSurcharge: '0', isActive: true,
};

export default function AdminRateCardsPage() {
  const [cards, setCards] = useState<RateCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCard, setEditCard] = useState<RateCard | null>(null);
  const [form, setForm] = useState<RateCardForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = () => adminApi.listRateCards().then((res) => setCards(res.data.data)).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditCard(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (c: RateCard) => {
    setEditCard(c);
    setForm({ orderType: c.orderType, rateType: c.rateType, minWeight: String(c.minWeight), maxWeight: String(c.maxWeight), ratePerKg: String(c.ratePerKg), baseCharge: String(c.baseCharge), codSurcharge: String(c.codSurcharge), isActive: c.isActive });
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const data = { ...form, minWeight: +form.minWeight, maxWeight: +form.maxWeight, ratePerKg: +form.ratePerKg, baseCharge: +form.baseCharge, codSurcharge: +form.codSurcharge };
    try {
      if (editCard) { await adminApi.updateRateCard(editCard._id, data); toast.success('Rate card updated!'); }
      else { await adminApi.createRateCard(data); toast.success('Rate card created!'); }
      setModalOpen(false); load();
    } catch (err) { toast.error(getAxiosError(err)); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try { await adminApi.deleteRateCard(id); setCards((p) => p.filter((c) => c._id !== id)); toast.success('Deleted'); setDeleteId(null); }
    catch (err) { toast.error(getAxiosError(err)); }
  };

  const f = (field: keyof RateCardForm, val: string | boolean) => setForm((p) => ({ ...p, [field]: val }));

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3"><CreditCard size={28} className="text-sky-400" /> Rate Cards</h1>
            <p className="text-slate-400 mt-1">{cards.length} rate cards</p>
          </div>
          <Button icon={<Plus size={18} />} onClick={openCreate}>Add Rate Card</Button>
        </motion.div>

        {loading ? <SkeletonTable rows={5} cols={7} /> : (
          <GlassCard hover={false} className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Type', 'Rate Type', 'Weight Range', 'Rate/kg', 'Base Charge', 'COD Surcharge', 'Active', ''].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {cards.map((card, i) => (
                      <motion.tr key={card._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 text-sm font-bold text-white">{card.orderType}</td>
                        <td className="px-5 py-4 text-sm text-slate-300">{card.rateType}</td>
                        <td className="px-5 py-4 text-sm text-slate-300">{card.minWeight}–{card.maxWeight} kg</td>
                        <td className="px-5 py-4 text-sm text-sky-400 font-semibold">{formatCurrency(card.ratePerKg)}</td>
                        <td className="px-5 py-4 text-sm text-emerald-400 font-semibold">{formatCurrency(card.baseCharge)}</td>
                        <td className="px-5 py-4 text-sm text-amber-400">{card.codSurcharge > 0 ? formatCurrency(card.codSurcharge) : '—'}</td>
                        <td className="px-5 py-4">
                          <div className={`w-2.5 h-2.5 rounded-full mx-auto ${card.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(card)} className="p-1.5 glass rounded-lg hover:bg-white/10 transition-colors"><Edit2 size={14} className="text-slate-400" /></button>
                            <button onClick={() => setDeleteId(card._id)} className="p-1.5 glass rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={14} className="text-slate-400 hover:text-red-400" /></button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                    {cards.length === 0 && (
                      <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">No rate cards. Add one to enable pricing.</td></tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* Modal */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editCard ? 'Edit Rate Card' : 'Create Rate Card'}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Order Type</label>
                <select value={form.orderType} onChange={(e) => f('orderType', e.target.value as OrderType)} className="w-full glass rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
                  <option value="B2C">B2C</option><option value="B2B">B2B</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Rate Type</label>
                <select value={form.rateType} onChange={(e) => f('rateType', e.target.value as RateType)} className="w-full glass rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
                  <option value="INTRA_ZONE">INTRA_ZONE</option><option value="INTER_ZONE">INTER_ZONE</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Min Weight (kg)" type="number" value={form.minWeight} onChange={(e) => f('minWeight', e.target.value)} />
              <Input label="Max Weight (kg)" type="number" value={form.maxWeight} onChange={(e) => f('maxWeight', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Rate/kg (₹)" type="number" value={form.ratePerKg} onChange={(e) => f('ratePerKg', e.target.value)} />
              <Input label="Base Charge (₹)" type="number" value={form.baseCharge} onChange={(e) => f('baseCharge', e.target.value)} />
              <Input label="COD Surcharge (₹)" type="number" value={form.codSurcharge} onChange={(e) => f('codSurcharge', e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => f('isActive', !form.isActive)} className={`relative w-12 h-6 rounded-full transition-all ${form.isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.isActive ? 'left-7' : 'left-1'}`} />
              </button>
              <span className="text-sm text-slate-300">{form.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
              <Button loading={saving} onClick={save} className="flex-1">{editCard ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </Modal>

        <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Rate Card">
          <p className="text-slate-400 mb-6">Are you sure you want to delete this rate card?</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={() => deleteId && remove(deleteId)} className="flex-1" icon={<Trash2 size={16} />}>Delete</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
