import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Truck, Shield, ArrowRight, CheckCircle2,
  Phone, Lock, KeyRound, User, Mail, ChevronDown, RefreshCw,
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import PackageScene from '../../three/PackageScene';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { getAxiosError } from '../../utils';
import type { UserRole } from '../../types';

/* ── Phone input with fixed +91 prefix ── */
function PhoneInput({
  id, label, value, onChange,
}: {
  id?: string; label: string;
  value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;
  return (
    <div className="relative">
      <div className={`flex items-stretch rounded-xl overflow-hidden transition-all duration-200 ${
        focused ? 'ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'ring-1 ring-white/10'
      }`}>
        {/* Prefix badge */}
        <div className="flex items-center gap-1 px-3 bg-white/5 border-r border-white/10 text-emerald-400 text-sm font-semibold select-none shrink-0">
          <Phone size={13} />
          <span>+91</span>
        </div>
        {/* Input area */}
        <div className="relative flex-1">
          <label className={`absolute left-3 transition-all duration-200 pointer-events-none z-10 ${
            lifted ? 'top-1.5 text-xs text-emerald-400' : 'top-1/2 -translate-y-1/2 text-sm text-slate-400'
          }`}>
            {label}
          </label>
          <input
            id={id}
            type="tel"
            maxLength={10}
            value={value}
            onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder=""
            className="w-full bg-white/5 text-slate-100 pt-6 pb-2 pl-3 pr-4 focus:outline-none text-sm"
          />
        </div>
      </div>
    </div>
  );
}

/* ───── Feature cards ───── */
const features = [
  { icon: Package, label: 'Live Tracking', desc: 'Real-time order status' },
  { icon: Truck, label: 'Smart Dispatch', desc: 'AI fleet routing' },
  { icon: Shield, label: 'Secure Portal', desc: 'Enterprise-grade auth' },
];

/* ───── Redirect map ───── */
const REDIRECT: Record<UserRole, string> = {
  CUSTOMER: '/customer',
  AGENT: '/agent',
  ADMIN: '/admin',
};

type AuthView = 'login' | 'register' | 'admin';

export default function LandingPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  /* ── top-level tab ── */
  const [view, setView] = useState<AuthView>('login');

  /* ── OTP Login state ── */
  const [loginEmail, setLoginEmail] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginStep, setLoginStep] = useState<'email' | 'otp'>('email');
  const [loginLoading, setLoginLoading] = useState(false);

  /* ── OTP Register state ── */
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPincode, setRegPincode] = useState('');
  const [regRole, setRegRole] = useState<'CUSTOMER' | 'AGENT'>('CUSTOMER');
  const [regOtp, setRegOtp] = useState('');
  const [regStep, setRegStep] = useState<'details' | 'otp'>('details');
  const [regLoading, setRegLoading] = useState(false);
  const [regDone, setRegDone] = useState(false);

  /* ── Admin email/password state ── */
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);

  /* ────────────────── HANDLERS ────────────────── */

  /* LOGIN – Step 1: Send OTP to email */
  async function handleLoginSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!loginEmail.trim() || !/\S+@\S+\.\S+/.test(loginEmail)) {
      toast.error('Enter a valid email address'); return;
    }
    try {
      setLoginLoading(true);
      await authApi.sendOtp(loginEmail.trim());
      toast.success('OTP sent! Check your email inbox.');
      setLoginStep('otp');
    } catch (err) {
      toast.error(getAxiosError(err));
    } finally {
      setLoginLoading(false);
    }
  }

  /* LOGIN – Step 2: Verify OTP */
  async function handleLoginVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (loginOtp.trim().length < 6) { toast.error('Enter the 6-digit OTP'); return; }
    try {
      setLoginLoading(true);
      const res = await authApi.verifyOtp({ email: loginEmail.trim(), otp: loginOtp, mode: 'login' });
      const { token, user } = res.data.data;
      login(token, user);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(REDIRECT[user.role]);
    } catch (err) {
      toast.error(getAxiosError(err));
    } finally {
      setLoginLoading(false);
    }
  }

  /* REGISTER – Step 1: Collect details → Send OTP to email */
  async function handleRegisterSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!regName.trim()) { toast.error('Enter your full name'); return; }
    if (!regEmail.trim() || !/\S+@\S+\.\S+/.test(regEmail)) { toast.error('Enter a valid email'); return; }
    const phone = regPhone.replace(/\D/g, '');
    if (phone.length < 10) { toast.error('Enter a valid 10-digit phone number'); return; }
    try {
      setRegLoading(true);
      await authApi.sendOtp(regEmail.trim());
      toast.success('OTP sent! Check your email inbox.');
      setRegStep('otp');
    } catch (err) {
      toast.error(getAxiosError(err));
    } finally {
      setRegLoading(false);
    }
  }

  /* REGISTER – Step 2: Verify OTP → Create account */
  async function handleRegisterVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (regOtp.trim().length < 6) { toast.error('Enter the 6-digit OTP'); return; }
    try {
      setRegLoading(true);
      const res = await authApi.verifyOtp({
        email: regEmail.trim(),
        otp: regOtp,
        name: regName,
        phone: regPhone,
        role: regRole,
        pincode: regRole === 'AGENT' ? regPincode.trim() : undefined,
        mode: 'register',
      });
      const { token, user } = res.data.data;
      login(token, user);
      toast.success(`Welcome to SwiftKart, ${user.name}!`);
      setRegDone(true);
      setTimeout(() => navigate(REDIRECT[user.role]), 1500);
    } catch (err) {
      toast.error(getAxiosError(err));
    } finally {
      setRegLoading(false);
    }
  }

  /* ADMIN – Email + Password */
  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!adminEmail || !adminPassword) { toast.error('Enter email and password'); return; }
    try {
      setAdminLoading(true);
      const res = await authApi.login({ email: adminEmail, password: adminPassword });
      const { token, user } = res.data.data;
      login(token, user);
      toast.success(`Welcome, ${user.name}!`);
      navigate(REDIRECT[user.role]);
    } catch (err) {
      toast.error(getAxiosError(err));
    } finally {
      setAdminLoading(false);
    }
  }

  /* ────────────────── RENDER ────────────────── */
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
      <PackageScene />
      <div className="cyber-aurora-bg" />
      <div className="cyber-grid-overlay" />
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-950/70 via-slate-950/40 to-slate-950/80 pointer-events-none" />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#f1f5f9',
            borderRadius: '12px',
          },
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row items-center gap-12">

        {/* ── Left: Hero ── */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="flex-1 text-center lg:text-left"
        >
          <div className="flex items-center gap-3 justify-center lg:justify-start mb-6">
            <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center glow-emerald shadow-lg">
              <Package size={24} className="text-white" />
            </div>
            <div>
              <span className="text-2xl font-black text-white tracking-tight">SwiftKart</span>
              <span className="text-xs text-yellow-400 font-bold block uppercase tracking-widest">Express Logistics</span>
            </div>
          </div>

          <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight mb-4">
            Shop Top Products.{' '}
            <span className="gradient-text glow-text-emerald">Track Live Deliveries.</span>
          </h1>
          <p className="text-base lg:text-lg text-slate-300 mb-8 max-w-md mx-auto lg:mx-0">
            Next-generation e-commerce & express fleet logistics for customers, agents, and admin staff.
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto lg:mx-0">
            {features.map(({ icon: Icon, label, desc }) => (
              <motion.div
                key={label}
                whileHover={{ scale: 1.05, y: -2 }}
                className="glass rounded-xl p-3 text-center"
              >
                <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center mx-auto mb-2 shadow-md">
                  <Icon size={16} className="text-white" />
                </div>
                <p className="text-xs font-semibold text-white">{label}</p>
                <p className="text-[11px] text-slate-400">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Right: Auth Card ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
          className="w-full max-w-md"
        >
          <div className="glass-strong rounded-3xl p-8 shadow-2xl border border-white/10">

            {/* ── Tab bar: Login | Sign Up | Admin ── */}
            <div className="flex glass rounded-2xl p-1 mb-6 text-xs font-bold">
              {([
                { id: 'login', label: 'Login', icon: Phone },
                { id: 'register', label: 'Sign Up', icon: User },
                { id: 'admin', label: 'Admin', icon: Lock },
              ] as { id: AuthView; label: string; icon: typeof Phone }[]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  id={`tab-${id}`}
                  onClick={() => {
                    setView(id);
                    // reset sub-steps
                    setLoginStep('email'); setLoginOtp('');
                    setRegStep('details'); setRegOtp(''); setRegDone(false);
                  }}
                  className={`flex-1 py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    view === id ? 'gradient-bg text-white shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* ════════════════ LOGIN (OTP) ════════════════ */}
              {view === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="text-center mb-5">
                    <p className="text-base font-bold text-white">Welcome Back</p>
                    <p className="text-xs text-slate-400 mt-0.5">Enter your registered email to receive a login OTP</p>
                  </div>

                  <AnimatePresence mode="wait">
                    {loginStep === 'email' && (
                      <motion.form
                        key="login-email"
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ duration: 0.2 }}
                        onSubmit={handleLoginSendOtp}
                        className="space-y-4"
                      >
                        <Input
                          id="login-email-input"
                          label="Email Address"
                          type="email"
                          placeholder="you@email.com"
                          value={loginEmail}
                          onChange={e => setLoginEmail(e.target.value)}
                        />
                        <Button
                          id="login-send-otp-btn"
                          type="submit"
                          size="lg"
                          loading={loginLoading}
                          className="w-full"
                          icon={<ArrowRight size={18} />}
                        >
                          Send OTP to Email
                        </Button>

                        {/* Sign up link */}
                        <p className="text-center text-xs text-slate-500 pt-1">
                          New here?{' '}
                          <button
                            type="button"
                            onClick={() => setView('register')}
                            className="text-emerald-400 hover:underline font-semibold"
                          >
                            Create an account
                          </button>
                        </p>
                      </motion.form>
                    )}

                    {loginStep === 'otp' && (
                      <motion.form
                        key="login-otp"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.2 }}
                        onSubmit={handleLoginVerifyOtp}
                        className="space-y-4"
                      >
                        <div className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-center">
                          <p>OTP sent to <span className="font-bold text-white">{loginEmail}</span></p>
                          <p className="text-slate-400 mt-1">Check your inbox (and spam folder) for the 6-digit code.</p>
                        </div>

                        <Input
                          id="login-otp-input"
                          label="Enter 6-Digit OTP"
                          type="text"
                          maxLength={6}
                          placeholder="_ _ _ _ _ _"
                          value={loginOtp}
                          onChange={e => setLoginOtp(e.target.value)}
                        />

                        <div className="flex gap-2">
                          <Button
                            id="login-resend-btn"
                            type="button"
                            variant="ghost"
                            className="w-1/3 text-xs flex items-center gap-1"
                            onClick={() => { setLoginStep('email'); setLoginOtp(''); }}
                          >
                            <RefreshCw size={13} /> Resend
                          </Button>
                          <Button
                            id="login-verify-btn"
                            type="submit"
                            size="lg"
                            loading={loginLoading}
                            className="w-2/3"
                            icon={<CheckCircle2 size={18} />}
                          >
                            Verify & Login
                          </Button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ════════════════ SIGN UP (OTP) ════════════════ */}
              {view === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  {/* Success state */}
                  {regDone ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 glow-emerald"
                      >
                        <CheckCircle2 size={40} className="text-emerald-400" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-white mb-2">Account Created!</h3>
                      <p className="text-slate-400 text-sm">Redirecting to your dashboard…</p>
                    </motion.div>
                  ) : (
                    <>
                      <div className="text-center mb-5">
                        <p className="text-base font-bold text-white">Create Account</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {regStep === 'details' ? 'Fill in your details to get started' : 'Verify your phone number'}
                        </p>
                      </div>

                      {/* Progress indicator */}
                      <div className="flex items-center gap-2 mb-5">
                        <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${regStep === 'details' ? 'bg-emerald-500/40' : 'bg-emerald-500'}`} />
                        <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${regStep === 'otp' ? 'bg-emerald-500' : 'bg-white/10'}`} />
                      </div>

                      <AnimatePresence mode="wait">
                        {/* Step 1: Details form */}
                        {regStep === 'details' && (
                          <motion.form
                            key="reg-details"
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 16 }}
                            transition={{ duration: 0.2 }}
                            onSubmit={handleRegisterSendOtp}
                            className="space-y-3"
                          >
                            <Input
                              id="reg-name-input"
                              label="Full Name"
                              placeholder="e.g. Karthik Kumar"
                              value={regName}
                              onChange={e => setRegName(e.target.value)}
                            />
                            <Input
                              id="reg-email-input"
                              label="Email Address"
                              type="email"
                              placeholder="you@email.com"
                              value={regEmail}
                              onChange={e => setRegEmail(e.target.value)}
                            />
                            <PhoneInput
                              id="reg-phone-input"
                              label="Mobile Number"
                              value={regPhone}
                              onChange={setRegPhone}
                            />

                            {/* Role selector */}
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                I am a
                              </label>
                              <div className="relative">
                                <select
                                  id="reg-role-select"
                                  value={regRole}
                                  onChange={e => setRegRole(e.target.value as 'CUSTOMER' | 'AGENT')}
                                  className="w-full appearance-none bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 cursor-pointer"
                                >
                                  <option value="CUSTOMER" className="bg-slate-900">Customer — Shop & track orders</option>
                                  <option value="AGENT" className="bg-slate-900">Delivery Agent — Deliver & manage routes</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              </div>
                            </div>

                            {/* Agent home pincode — only shown for AGENT role */}
                            {regRole === 'AGENT' && (
                              <div className="space-y-1">
                                <Input
                                  id="reg-pincode-input"
                                  label="Home Pincode (Your service area)"
                                  type="text"
                                  maxLength={6}
                                  placeholder="e.g. 500001"
                                  value={regPincode}
                                  onChange={e => setRegPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                />
                                <p className="text-xs text-slate-500 px-1">
                                  📍 You'll be assigned to deliver in this pincode's zone
                                </p>
                              </div>
                            )}

                            <Button
                              id="reg-send-otp-btn"
                              type="submit"
                              size="lg"
                              loading={regLoading}
                              className="w-full !mt-2"
                              icon={<ArrowRight size={18} />}
                            >
                              Continue — Send OTP
                            </Button>

                            {/* Login link */}
                            <p className="text-center text-xs text-slate-500 pt-1">
                              Already registered?{' '}
                              <button
                                type="button"
                                onClick={() => setView('login')}
                                className="text-emerald-400 hover:underline font-semibold"
                              >
                                Login here
                              </button>
                            </p>
                          </motion.form>
                        )}

                        {/* Step 2: OTP verify */}
                        {regStep === 'otp' && (
                          <motion.form
                            key="reg-otp"
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -16 }}
                            transition={{ duration: 0.2 }}
                            onSubmit={handleRegisterVerifyOtp}
                            className="space-y-4"
                          >
                            {/* Summary pill */}
                            <div className="glass rounded-xl p-3 text-xs border border-white/10 space-y-1">
                              <div className="flex items-center gap-2 text-slate-300">
                                <User size={13} className="text-emerald-400 shrink-0" />
                                <span className="font-semibold text-white">{regName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-300">
                                <Mail size={13} className="text-emerald-400 shrink-0" />
                                <span>{regEmail}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-300">
                                <Phone size={13} className="text-emerald-400 shrink-0" />
                                <span>+91 {regPhone}</span>
                                <span className="ml-auto text-[10px] uppercase tracking-wide text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                                  {regRole}
                                </span>
                              </div>
                            </div>

                        <div className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-center">
                          <p>OTP sent to <span className="font-bold text-white">{regEmail}</span></p>
                          <p className="text-slate-400 mt-1">Check your inbox (and spam folder) for the 6-digit code.</p>
                        </div>

                            <Input
                              id="reg-otp-input"
                              label="Enter 6-Digit OTP"
                              type="text"
                              maxLength={6}
                              placeholder="_ _ _ _ _ _"
                              value={regOtp}
                              onChange={e => setRegOtp(e.target.value)}
                            />

                            <div className="flex gap-2">
                              <Button
                                id="reg-back-btn"
                                type="button"
                                variant="ghost"
                                className="w-1/3 text-xs flex items-center gap-1"
                                onClick={() => { setRegStep('details'); }}
                              >
                                <RefreshCw size={13} /> Back
                              </Button>
                              <Button
                                id="reg-verify-btn"
                                type="submit"
                                size="lg"
                                loading={regLoading}
                                className="w-2/3"
                                icon={<CheckCircle2 size={18} />}
                              >
                                Verify & Create Account
                              </Button>
                            </div>
                          </motion.form>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </motion.div>
              )}

              {/* ════════════════ ADMIN (Email + Password) ════════════════ */}
              {view === 'admin' && (
                <motion.form
                  key="admin"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                  onSubmit={handleAdminLogin}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                      <Lock size={22} className="text-amber-400" />
                    </div>
                    <p className="text-base font-bold text-white">Admin Portal</p>
                    <p className="text-xs text-slate-400 mt-0.5">Secure entry for administrators</p>
                  </div>

                  <Input
                    id="admin-email-input"
                    label="Admin Email"
                    type="email"
                    placeholder="admin@deliverytracker.com"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                  />
                  <div className="relative">
                    <Input
                      id="admin-password-input"
                      label="Password"
                      type={showAdminPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-3 top-1/2 translate-y-0.5 text-slate-400 hover:text-white transition-colors"
                    >
                      <KeyRound size={16} />
                    </button>
                  </div>

                  <Button
                    id="admin-login-btn"
                    type="submit"
                    size="lg"
                    loading={adminLoading}
                    className="w-full"
                    icon={<ArrowRight size={18} />}
                  >
                    Sign In as Admin
                  </Button>

                  {/* Demo shortcut */}
                  <button
                    type="button"
                    onClick={() => { setAdminEmail('admin@deliverytracker.com'); setAdminPassword('Admin@123'); }}
                    className="w-full text-center text-xs text-amber-400/70 hover:text-amber-400 transition-colors py-1 flex items-center justify-center gap-1"
                  >
                    <KeyRound size={12} /> Auto-fill demo admin credentials
                  </button>
                </motion.form>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
