import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Menu, X, ChevronDown, LogOut, User, ShoppingCart, Heart, Store, Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const navLinks = {
  CUSTOMER: [
    { label: 'Shop Catalog', to: '/customer' },
    { label: 'My Orders', to: '/customer/orders' },
    { label: 'Track Package', to: '/customer/track' },
    { label: 'Profile', to: '/customer/profile' },
  ],
  AGENT: [
    { label: 'Dashboard', to: '/agent' },
    { label: 'My Deliveries', to: '/agent/orders' },
  ],
  ADMIN: [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Orders', to: '/admin/orders' },
    { label: 'Agents', to: '/admin/agents' },
    { label: 'Zones', to: '/admin/zones' },
    { label: 'Rate Cards', to: '/admin/rate-cards' },
    { label: 'Customers', to: '/admin/customers' },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems, wishlist } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const links = user ? navLinks[user.role] ?? [] : [];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? `/${user.role.toLowerCase()}` : '/'} className="flex items-center gap-3 group">
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="w-9 h-9 gradient-bg rounded-xl flex items-center justify-center glow-emerald shadow-lg"
            >
              <Package size={18} className="text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-lg font-black gradient-text tracking-tight hidden sm:block">
                SwiftKart
              </span>
              <span className="text-[10px] text-yellow-400 font-bold tracking-widest uppercase hidden sm:block">
                Express Logistics
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => {
                const active =
                  location.pathname === link.to ||
                  (link.to !== '/customer' && location.pathname.startsWith(link.to));
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="relative px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors group"
                  >
                    <span className={active ? 'text-emerald-400 font-bold' : 'text-slate-300 group-hover:text-white'}>
                      {link.label}
                    </span>
                    {active && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 bg-emerald-500/15 rounded-xl border border-emerald-500/30"
                        transition={{ type: 'spring', bounce: 0.2 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* User & Cart Quick Controls */}
          {user && (
            <div className="flex items-center gap-3">
              {/* Customer specific: Cart & Wishlist icons */}
              {user.role === 'CUSTOMER' && (
                <>
                  <Link
                    to="/customer/profile"
                    className="relative p-2.5 glass rounded-xl hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
                  >
                    <Heart size={18} fill={wishlist.length > 0 ? '#ef4444' : 'none'} className={wishlist.length > 0 ? 'text-red-500' : ''} />
                    {wishlist.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                        {wishlist.length}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/customer/cart"
                    className="relative p-2.5 gradient-bg rounded-xl text-white shadow-lg glow-emerald hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <ShoppingCart size={18} />
                    <span className="text-xs font-bold hidden sm:inline">Cart</span>
                    {totalItems > 0 && (
                      <span className="bg-yellow-400 text-slate-950 font-black text-xs px-1.5 py-0.5 rounded-full">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                </>
              )}

              {/* User Dropdown */}
              <div className="hidden sm:flex items-center relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 glass rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="w-7 h-7 gradient-bg rounded-full flex items-center justify-center">
                    <User size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-slate-200 max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-14 right-0 bg-slate-900 border border-slate-700 rounded-2xl p-3 min-w-[200px] shadow-2xl z-[100]"
                    >
                      <div className="px-3 py-2 border-b border-white/10 mb-1">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          {user.role} ACCOUNT
                        </p>
                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>

                      {user.role === 'CUSTOMER' && (
                        <Link
                          to="/customer/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <User size={14} /> My Profile
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mt-1"
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2.5 glass rounded-xl text-slate-300"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && user && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-white/10 overflow-hidden glass-dark"
          >
            <div className="px-4 py-3 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 font-semibold text-sm transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 font-semibold text-sm transition-colors flex items-center gap-2"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
