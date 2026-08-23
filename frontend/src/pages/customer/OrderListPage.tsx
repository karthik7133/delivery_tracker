import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Package, ArrowRight, Filter, Search, Calendar,
  Truck, CheckCircle2, ShoppingBag, MapPin, Eye, Sparkles
} from 'lucide-react';
import { ordersApi } from '../../api/orders';
import type { Order, OrderStatus } from '../../types';
import { PRODUCTS, FALLBACK_PRODUCT_IMAGE } from '../../data/products';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import { SkeletonList } from '../../components/ui/Skeleton';
import { formatCurrency, formatDate } from '../../utils';

const filters: { label: string; value: string }[] = [
  { label: 'All Orders', value: '' },
  { label: 'Active', value: 'ASSIGNED' },
  { label: 'In Transit', value: 'IN_TRANSIT' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Failed', value: 'FAILED' },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function OrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrdersList = () => {
      ordersApi
        .list(statusFilter ? { status: statusFilter } : undefined)
        .then((res) => {
          const data = res.data.data;
          setOrders(Array.isArray(data) ? data : data?.items ?? []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    fetchOrdersList();
    const interval = setInterval(fetchOrdersList, 4000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  // Helper to determine the best image for an order
  const getOrderImage = (order: Order, index: number): string => {
    if (order.orderImage) return order.orderImage;
    if (order.items && order.items.length > 0 && order.items[0].image) {
      return order.items[0].image;
    }
    // Fallback to product images catalog deterministically
    const fallbackProduct = PRODUCTS[index % PRODUCTS.length];
    return fallbackProduct?.image || FALLBACK_PRODUCT_IMAGE;
  };

  // Helper for order item title summary
  const getOrderTitle = (order: Order): string => {
    if (order.items && order.items.length > 0) {
      const firstItem = order.items[0].name;
      const extraCount = order.items.length - 1;
      return extraCount > 0 ? `${firstItem} (+${extraCount} more)` : firstItem;
    }
    return `${order.orderType} Express Package Shipment`;
  };

  // Filtered orders list by search
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      const matchId = o.orderId.toLowerCase().includes(query);
      const matchCity =
        o.pickup.city.toLowerCase().includes(query) ||
        o.drop.city.toLowerCase().includes(query);
      const matchItems = o.items?.some((it) =>
        it.name.toLowerCase().includes(query)
      );
      return matchId || matchCity || matchItems;
    });
  }, [orders, searchQuery]);

  // Stats computation
  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter((o) => o.status === 'DELIVERED').length;
    const active = orders.filter((o) =>
      ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'CREATED'].includes(
        o.status
      )
    ).length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.pricing?.totalCharge || 0), 0);
    return { total, delivered, active, totalSpent };
  }, [orders]);

  return (
    <div className="min-h-screen py-8 px-4 max-w-5xl mx-auto space-y-8">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <ShoppingBag size={22} />
            </span>
            <h1 className="text-3xl font-black text-white">My Orders History</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Track, view items, and manage all your past and active orders
          </p>
        </div>

        <Button
          icon={<Plus size={18} />}
          variant="primary"
          onClick={() => navigate('/customer/create-order')}
        >
          New Order
        </Button>
      </motion.div>

      {/* ── Stats Overview Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard hover={false} className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
            <Package size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold">Total Orders</p>
            <p className="text-xl font-black text-white">{stats.total}</p>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Truck size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold">Active & In-Transit</p>
            <p className="text-xl font-black text-amber-400">{stats.active}</p>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold">Delivered</p>
            <p className="text-xl font-black text-emerald-400">{stats.delivered}</p>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold">Total Value</p>
            <p className="text-lg font-black gradient-text">
              {formatCurrency(stats.totalSpent)}
            </p>
          </div>
        </GlassCard>
      </div>

      {/* ── Search & Filters ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by Order ID, item name, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-strong rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Filter size={16} className="text-slate-400 flex-shrink-0 mr-1" />
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  statusFilter === f.value
                    ? 'gradient-bg text-white shadow-lg glow-emerald'
                    : 'glass text-slate-300 hover:text-white border border-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Orders History List with Item Images ── */}
      {loading ? (
        <SkeletonList count={4} />
      ) : filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 glass rounded-3xl border border-white/10"
        >
          <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center mx-auto mb-4 float-animation">
            <Package size={36} className="text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No orders found</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            {searchQuery
              ? `No orders matching "${searchQuery}"`
              : 'Place an order from our catalog or request express delivery.'}
          </p>
          <Button
            onClick={() => navigate('/customer')}
            variant="primary"
            icon={<ShoppingBag size={18} />}
          >
            Explore Dashboard & Shop
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {filteredOrders.map((order, idx) => {
            const orderImg = getOrderImage(order, idx);
            const title = getOrderTitle(order);
            const itemsCount = order.items?.length || 1;

            return (
              <motion.div key={order._id} variants={itemVariants}>
                <GlassCard
                  onClick={() => navigate(`/customer/orders/${order._id}`)}
                  className="cursor-pointer group relative overflow-hidden p-5 hover:border-emerald-500/50 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    {/* Order Image Thumbnail with Badge */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={orderImg}
                        alt={title}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            FALLBACK_PRODUCT_IMAGE;
                        }}
                        className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl glass border border-white/15 group-hover:scale-105 transition-transform duration-300 shadow-md"
                      />
                      {itemsCount > 1 && (
                        <span className="absolute bottom-1 right-1 px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[11px] font-black shadow-lg">
                          +{itemsCount - 1} items
                        </span>
                      )}
                    </div>

                    {/* Order Content Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-sm font-black text-emerald-400">
                          {order.orderId}
                        </span>
                        <StatusBadge status={order.status as OrderStatus} />
                        <span className="text-xs px-2.5 py-0.5 rounded-full glass border border-white/10 text-slate-300 font-semibold">
                          {order.orderType} · {order.paymentType}
                        </span>
                      </div>

                      {/* Product Title / Summary */}
                      <h3 className="text-base font-extrabold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {title}
                      </h3>

                      {/* Route Cities */}
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <MapPin size={12} /> {order.pickup.city}
                        </span>
                        <ArrowRight size={12} className="text-slate-500 flex-shrink-0" />
                        <span className="flex items-center gap-1 text-sky-400">
                          <MapPin size={12} /> {order.drop.city}
                        </span>
                      </div>

                      {/* Order Creation Date */}
                      <p className="text-xs text-slate-400 flex items-center gap-1 pt-0.5">
                        <Calendar size={12} className="text-slate-500" />
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    {/* Pricing & View Action */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10 gap-3">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                          Total Amount
                        </span>
                        <span className="text-xl font-black gradient-text">
                          {formatCurrency(order.pricing?.totalCharge || 0)}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Eye size={14} />}
                        className="text-xs group-hover:border-emerald-500/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customer/orders/${order._id}`);
                        }}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
