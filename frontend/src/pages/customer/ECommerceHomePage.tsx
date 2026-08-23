import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Star, ShoppingCart, Zap, Heart, Filter,
  Sparkles, Tag, Timer, Gift, Check, ArrowRight, X, ArrowUpDown,
  Truck, ShieldCheck, RefreshCw, Headphones
} from 'lucide-react';
import { PRODUCTS, CATEGORIES, type Product, FALLBACK_PRODUCT_IMAGE } from '../../data/products';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import ProductDetailModal from '../../components/ui/ProductDetailModal';
import Modal from '../../components/ui/Modal';

const HERO_BANNERS = [
  {
    id: 1,
    title: 'SWIFTKART GRAND SHOPPING FESTIVAL',
    subtitle: 'Up to 50% OFF on Top Tech & Gadgets + Free 2-Day Express Delivery',
    tag: 'FESTIVE SALE LIVE',
    bg: 'from-blue-600/40 via-emerald-600/30 to-purple-600/40',
    btnText: 'Explore Grand Deals',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1000&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    title: 'SMARTPHONES & AUDIO ESSENTIALS',
    subtitle: 'Use Code SWIFT10 for Extra 10% Discount + No-Cost EMI Available',
    tag: 'MEGA SAVINGS',
    bg: 'from-amber-600/40 via-emerald-600/30 to-sky-600/40',
    btnText: 'Shop Electronics',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1000&auto=format&fit=crop&q=80',
  },
];

type SortOption = 'featured' | 'price-low' | 'price-high' | 'rating' | 'discount';

export default function ECommerceHomePage() {
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [activeBanner, setActiveBanner] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [promoPopupOpen, setPromoPopupOpen] = useState(false);
  const [claimedPromo, setClaimedPromo] = useState(false);

  // Auto slide banner
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % HERO_BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Show promo popup on first visit
  useEffect(() => {
    const shown = sessionStorage.getItem('dt_swift_promo_shown');
    if (!shown) {
      const timeout = setTimeout(() => {
        setPromoPopupOpen(true);
        sessionStorage.setItem('dt_swift_promo_shown', 'true');
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, []);

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    let result = PRODUCTS.filter((p) => {
      const matchCategory =
        selectedCategory === 'All Categories' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.seller.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });

    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'discount') result.sort((a, b) => b.discount - a.discount);

    return result;
  }, [selectedCategory, searchQuery, sortBy]);

  const dealProducts = PRODUCTS.filter((p) => p.isDealOfDay);

  const handleBuyNow = (product: Product) => {
    addToCart(product, 1);
    navigate('/customer/cart');
  };

  return (
    <div className="min-h-screen py-6 px-4 max-w-7xl mx-auto space-y-8">
      {/* ── Top Controls: Search, Sort & Category Pills ── */}
      <div className="space-y-4">
        {/* Search Bar & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search for products, smartphones, fashion, audio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-strong rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 glass rounded-2xl px-3 py-2 sm:w-auto">
            <ArrowUpDown size={16} className="text-slate-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-2"
            >
              <option value="featured" className="bg-slate-900 text-white">Sort: Featured</option>
              <option value="price-low" className="bg-slate-900 text-white">Price: Low to High</option>
              <option value="price-high" className="bg-slate-900 text-white">Price: High to Low</option>
              <option value="rating" className="bg-slate-900 text-white">Highest Rated</option>
              <option value="discount" className="bg-slate-900 text-white">Biggest Discount</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Filter size={16} className="text-slate-400 flex-shrink-0 mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat
                  ? 'gradient-bg text-white shadow-lg glow-emerald'
                  : 'glass text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero Event Banner Slider ── */}
      <div className="relative rounded-3xl overflow-hidden glass border border-white/15 h-64 md:h-80 shadow-2xl">
        <AnimatePresence mode="wait">
          {HERO_BANNERS.map((banner, index) =>
            index === activeBanner ? (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-between p-6 md:p-12 bg-gradient-to-r"
              >
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-25"
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${banner.bg}`} />

                <div className="relative z-10 max-w-xl space-y-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md">
                    <Sparkles size={12} />
                    {banner.tag}
                  </span>
                  <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">
                    {banner.title}
                  </h2>
                  <p className="text-xs md:text-sm text-slate-200">
                    {banner.subtitle}
                  </p>
                  <Button
                    size="md"
                    variant="primary"
                    icon={<ArrowRight size={16} />}
                    onClick={() => {
                      const el = document.getElementById('catalog-products');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {banner.btnText}
                  </Button>
                </div>

                <div className="absolute bottom-4 right-6 flex gap-2 z-10">
                  {HERO_BANNERS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveBanner(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        activeBanner === i ? 'bg-emerald-400 w-6' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            ) : null
          )}
        </AnimatePresence>
      </div>

      {/* ── Value Proposition Badges ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-300">
        <GlassCard hover={false} className="p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Truck size={18} />
          </div>
          <div>
            <p className="font-bold text-white">Free Express Shipping</p>
            <p className="text-[11px] text-slate-400">On all orders in active zones</p>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="font-bold text-white">100% Original Products</p>
            <p className="text-[11px] text-slate-400">Direct brand warranty</p>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
            <RefreshCw size={18} />
          </div>
          <div>
            <p className="font-bold text-white">7-Day Easy Return</p>
            <p className="text-[11px] text-slate-400">Hassle-free replacement</p>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
            <Headphones size={18} />
          </div>
          <div>
            <p className="font-bold text-white">24/7 Swift Support</p>
            <p className="text-[11px] text-slate-400">Dedicated assistance</p>
          </div>
        </GlassCard>
      </div>

      {/* ── Deals of the Day Flash Sale ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                Swift Deals of the Day
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Timer size={12} className="text-amber-400" /> Ends in 04h 15m 30s
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dealProducts.map((product) => (
            <GlassCard
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="cursor-pointer group relative overflow-hidden flex flex-col justify-between p-4"
            >
              <div className="relative mb-3">
                <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-red-500 text-white font-bold text-xs shadow-md">
                  {product.discount}% OFF
                </span>
                <img
                  src={product.image}
                  alt={product.name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                  }}
                  className="w-full h-36 object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div>
                <p className="text-xs text-slate-400 font-medium">{product.category}</p>
                <h4 className="text-xs font-bold text-white line-clamp-2 mt-0.5 group-hover:text-emerald-400 transition-colors">
                  {product.name}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-black text-emerald-400">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="text-xs line-through text-slate-500">
                    {formatCurrency(product.originalPrice)}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* ── Main Catalog Grid ── */}
      <div id="catalog-products" className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-white">
            {selectedCategory === 'All Categories'
              ? 'Trending Products'
              : selectedCategory}
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredProducts.length} products
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const inWishlist = isInWishlist(product.id);
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard
                  hover={false}
                  className="h-full flex flex-col justify-between p-4 group relative cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  {/* Image & Wishlist Button */}
                  <div className="relative mb-3">
                    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-emerald-500 text-white font-bold text-xs shadow-md">
                      {product.discount}% OFF
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className={`absolute top-2 right-2 z-10 p-2 rounded-full glass transition-colors ${
                        inWishlist
                          ? 'bg-red-500/20 text-red-500 border-red-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
                    </button>
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                      }}
                      className="w-full h-44 object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Title & Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">
                        {product.category}
                      </span>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                        <span>{product.rating}</span>
                        <Star size={10} fill="currentColor" />
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-emerald-400 transition-colors">
                      {product.name}
                    </h4>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-lg font-black text-white">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="text-xs line-through text-slate-500">
                        {formatCurrency(product.originalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 mt-auto">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 text-xs"
                      icon={<ShoppingCart size={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                    >
                      Cart
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      className="flex-1 text-xs"
                      icon={<Zap size={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyNow(product);
                      }}
                    >
                      Buy Now
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Product Detail Modal ── */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onBuyNow={handleBuyNow}
      />

      {/* ── Festive Offer Event Popup Modal ── */}
      <Modal open={promoPopupOpen} onClose={() => setPromoPopupOpen(false)} title="🎁 SwiftKart Grand Sale Voucher">
        <div className="text-center space-y-4 py-2">
          <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto glow-emerald animate-bounce">
            <Gift size={32} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Claim 10% Extra Discount</h3>
            <p className="text-xs text-slate-400 mt-1">Use promo code below at checkout on any order</p>
          </div>

          <div className="glass rounded-xl p-4 border border-yellow-400/40 bg-yellow-400/10">
            <p className="text-xs text-yellow-300 font-bold uppercase tracking-wider mb-1">PROMO CODE</p>
            <p className="text-2xl font-black font-mono text-yellow-400">SWIFT10</p>
          </div>

          <Button
            size="md"
            variant="primary"
            className="w-full"
            icon={claimedPromo ? <Check size={16} /> : <Tag size={16} />}
            onClick={() => {
              navigator.clipboard.writeText('SWIFT10');
              setClaimedPromo(true);
              setTimeout(() => setPromoPopupOpen(false), 1200);
            }}
          >
            {claimedPromo ? 'Code Copied! Enjoy Shopping' : 'Copy Code & Start Shopping'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
