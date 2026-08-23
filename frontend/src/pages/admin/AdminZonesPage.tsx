import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, MapPin, X } from 'lucide-react';
import { adminApi } from '../../api/admin';
import type { Zone } from '../../types';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { SkeletonList } from '../../components/ui/Skeleton';
import { getAxiosError } from '../../utils';

interface ZoneFormData {
  name: string;
  code: string;
  areas: string;
  pincodes: string;
}

const defaultForm: ZoneFormData = { name: '', code: '', areas: '', pincodes: '' };

export default function AdminZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editZone, setEditZone] = useState<Zone | null>(null);
  const [form, setForm] = useState<ZoneFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = () => {
    adminApi.listZones().then((res) => setZones(res.data.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditZone(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (zone: Zone) => {
    setEditZone(zone);
    setForm({ name: zone.name, code: zone.code, areas: zone.areas.join(', '), pincodes: zone.pincodes.join(', ') });
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const data = {
      name: form.name,
      code: form.code,
      areas: form.areas.split(',').map((s) => s.trim()).filter(Boolean),
      pincodes: form.pincodes.split(',').map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editZone) {
        await adminApi.updateZone(editZone._id, data);
        toast.success('Zone updated!');
      } else {
        await adminApi.createZone(data);
        toast.success('Zone created!');
      }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(getAxiosError(err)); }
    finally { setSaving(false); }
  };

  const deleteZone = async (id: string) => {
    try {
      await adminApi.deleteZone(id);
      setZones((prev) => prev.filter((z) => z._id !== id));
      toast.success('Zone deleted');
      setDeleteId(null);
    } catch (err) { toast.error(getAxiosError(err)); }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3"><MapPin size={28} className="text-emerald-400" /> Zones</h1>
            <p className="text-slate-400 mt-1">{zones.length} zones configured</p>
          </div>
          <Button icon={<Plus size={18} />} onClick={openCreate}>Add Zone</Button>
        </motion.div>

        {loading ? <SkeletonList count={4} /> : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {zones.map((zone, i) => (
                <motion.div key={zone._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.05 }}>
                  <GlassCard>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 glass rounded-lg text-xs font-mono font-bold text-emerald-400">{zone.code}</span>
                          <div className={`w-2 h-2 rounded-full ${zone.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        </div>
                        <h3 className="font-bold text-white mt-1">{zone.name}</h3>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(zone)} className="p-1.5 glass rounded-lg hover:bg-white/10 transition-colors"><Edit2 size={14} className="text-slate-400" /></button>
                        <button onClick={() => setDeleteId(zone._id)} className="p-1.5 glass rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={14} className="text-slate-400 hover:text-red-400" /></button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Areas</p>
                        <div className="flex flex-wrap gap-1">
                          {zone.areas.slice(0, 4).map((a) => (
                            <span key={a} className="px-2 py-0.5 glass rounded-full text-xs text-slate-300">{a}</span>
                          ))}
                          {zone.areas.length > 4 && <span className="text-xs text-slate-500">+{zone.areas.length - 4} more</span>}
                          {zone.areas.length === 0 && <span className="text-xs text-slate-600">No areas</span>}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">{zone.pincodes.length} pincode{zone.pincodes.length !== 1 ? 's' : ''}</p>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
            {zones.length === 0 && <p className="text-slate-400 col-span-3 text-center py-12">No zones yet. Create one to get started.</p>}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editZone ? 'Edit Zone' : 'Create Zone'}>
          <div className="space-y-4">
            <Input label="Zone Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input label="Zone Code (e.g. NORTH)" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Areas (comma-separated)</label>
              <textarea
                value={form.areas}
                onChange={(e) => setForm((f) => ({ ...f, areas: e.target.value }))}
                placeholder="Delhi, Noida, Gurgaon..."
                rows={2}
                className="w-full glass rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Pincodes (comma-separated)</label>
              <textarea
                value={form.pincodes}
                onChange={(e) => setForm((f) => ({ ...f, pincodes: e.target.value }))}
                placeholder="110001, 110002, 110003..."
                rows={2}
                className="w-full glass rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
              <Button loading={saving} onClick={save} className="flex-1">{editZone ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation */}
        <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Zone">
          <p className="text-slate-400 mb-6">Are you sure you want to delete this zone? This cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={() => deleteId && deleteZone(deleteId)} className="flex-1" icon={<Trash2 size={16} />}>Delete</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
