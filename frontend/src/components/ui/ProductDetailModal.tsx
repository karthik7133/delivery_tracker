import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShoppingCart, Zap, Heart, Truck, ShieldCheck, MapPin, CheckCircle2, X } from 'lucide-react';
import { type Product, FALLBACK_PRODUCT_IMAGE } from '../../data/products';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils';
import Button from './Button';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onBuyNow: (product: Product) => void;
}

export default function ProductDetailModal({ product, onClose, onBuyNow }: ProductDetailModalProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState<{ checked: boolean; valid: boolean; text?: string } | null>(null);

  if (!product) return null;

  const handleCheckPincode = () => {
    if (!pincode || pincode.length !== 6) {
      setDeliveryInfo({ checked: true, valid: false, text: 'Please enter a valid 6-digit pincode' });
      return;
    }
    // Check if pincode matches GNT (522xxx) or VJA (520xxx) zones
    if (pincode.startsWith('522') || pincode.startsWith('520') || pincode.startsWith('110') || pincode.startsWith('560')) {
      setDeliveryInfo({
        checked: true,
        valid: true,
        text: 'Express Delivery Available — Delivered in 2 Business Days',
      });
    } else {
      setDeliveryInfo({
        checked: true,
        valid: true,
        text: 'Standard Delivery Available — Delivered in 4-5 Business Days',
      });
    }
  };

  const inWishlist = isInWishlist(product.id);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative glass-strong rounded-3xl p-6 md:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full glass hover:bg-white/10 transition-colors z-10"
          >
            <X size={20} className="text-slate-300" />
          </button>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Left: Product Image */}
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden glass p-4 bg-slate-900/50 flex items-center justify-center group">
                <img
                  src={product.image}
                  alt={product.name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                  }}
                  className="w-full h-80 object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                />
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`absolute top-6 right-6 p-3 rounded-full glass backdrop-blur-md transition-all ${
                    inWishlist ? 'bg-red-500/20 text-red-500 border-red-500/40' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="glass rounded-xl p-3 flex items-center gap-2">
                  <Truck size={18} className="text-emerald-400 flex-shrink-0" />
                  <span>Free Express Delivery Available</span>
                </div>
                <div className="glass rounded-xl p-3 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-sky-400 flex-shrink-0" />
                  <span>100% Brand Original Warranty</span>
                </div>
              </div>
            </div>

            {/* Right: Details */}
            <div className="space-y-6">
              <div>
                <span className="px-3 py-1 glass rounded-full text-xs font-semibold text-emerald-400">
                  {product.category}
                </span>
                <h2 className="text-2xl font-extrabold text-white mt-2 leading-snug">
                  {product.name}
                </h2>
                <p className="text-xs text-slate-400 mt-1">Sold by {product.seller}</p>

                {/* Rating */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-xs font-bold">
                    <span>{product.rating}</span>
                    <Star size={12} fill="white" />
                  </div>
                  <span className="text-xs text-slate-400">
                    ({product.reviewsCount.toLocaleString()} ratings)
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="glass rounded-2xl p-4 flex items-center gap-4">
                <div>
                  <p className="text-3xl font-black text-white">
                    {formatCurrency(product.price)}
                  </p>
                  <div className="flex items-center gap-2 text-sm mt-0.5">
                    <span className="line-through text-slate-500">
                      {formatCurrency(product.originalPrice)}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {product.discount}% OFF
                    </span>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    product.stock > 10 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {product.stock > 0 ? `In Stock (${product.stock} left)` : 'Out of Stock'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-300 leading-relaxed">
                {product.description}
              </p>

              {/* Pincode Availability Check */}
              <div className="glass rounded-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <MapPin size={14} className="text-emerald-400" />
                  Check Delivery Availability
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="flex-1 glass rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <button
                    onClick={handleCheckPincode}
                    className="px-4 py-2 rounded-xl text-xs font-bold gradient-bg text-white hover:opacity-90 transition-opacity"
                  >
                    Check
                  </button>
                </div>
                {deliveryInfo && (
                  <p className={`text-xs flex items-center gap-1.5 ${deliveryInfo.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                    {deliveryInfo.valid && <CheckCircle2 size={14} />}
                    {deliveryInfo.text}
                  </p>
                )}
              </div>

              {/* Specs Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Specifications</h4>
                <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5 text-xs">
                  {Object.entries(product.specs).map(([key, val]) => (
                    <div key={key} className="flex px-4 py-2.5">
                      <span className="w-1/3 text-slate-400 font-medium">{key}</span>
                      <span className="w-2/3 text-white font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  icon={<ShoppingCart size={18} />}
                  onClick={() => {
                    addToCart(product);
                    onClose();
                  }}
                >
                  Add to Cart
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  icon={<Zap size={18} />}
                  onClick={() => {
                    addToCart(product);
                    onBuyNow(product);
                  }}
                >
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
