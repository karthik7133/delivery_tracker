import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, UserSquare2 } from 'lucide-react';
import { adminApi } from '../../api/admin';
import type { Customer } from '../../types';
import GlassCard from '../../components/ui/GlassCard';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { formatDateOnly } from '../../utils';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminApi.listCustomers()
      .then((res) => setCustomers(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase())
      )
    : customers;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3"><UserSquare2 size={28} className="text-emerald-400" /> Customers</h1>
            <p className="text-slate-400 mt-1">{filtered.length} customers</p>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="glass rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 w-64"
            />
          </div>
        </motion.div>

        {loading ? <SkeletonTable rows={6} cols={4} /> : (
          <GlassCard hover={false} className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Name', 'Email', 'Phone', 'Joined'].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <motion.tr
                      key={c._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-5 py-4 font-semibold text-white">{c.name}</td>
                      <td className="px-5 py-4 text-sm text-slate-300">{c.email}</td>
                      <td className="px-5 py-4 text-sm text-slate-400">{c.phone ?? '—'}</td>
                      <td className="px-5 py-4 text-xs text-slate-500">{formatDateOnly(c.createdAt)}</td>
                    </motion.tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400">No customers found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
