import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * RegisterPage — two-step: role selection → details form
 */
const ROLES = [
  {
    id: 'buyer',
    icon: '🛍️',
    title: "I'm a Buyer",
    desc: 'Search products, book pickups, collect with a secure PIN.',
    gradient: 'from-blue-50 to-indigo-50/60',
    border: 'border-blue-200',
    text: 'text-blue-700',
    activeBorder: 'border-blue-500',
    activeBg: 'bg-blue-600',
  },
  {
    id: 'shopkeeper',
    icon: '🏪',
    title: "I'm a Shopkeeper",
    desc: 'List my store, manage inventory, process pickup orders.',
    gradient: 'from-violet-50 to-fuchsia-50/60',
    border: 'border-violet-200',
    text: 'text-violet-700',
    activeBorder: 'border-violet-500',
    activeBg: 'bg-violet-600',
  },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState(params.get('role') || '');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // If role pre-selected via query param, skip to step 2
  useEffect(() => {
    if (params.get('role') && ['buyer', 'shopkeeper'].includes(params.get('role'))) {
      setStep(2);
    }
  }, []);

  const handleRoleSelect = (r) => {
    setRole(r);
    setStep(2);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (form.confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setLoading(true);
    setServerError('');
    const result = await register({ name: form.name, email: form.email, password: form.password, phone: form.phone, role });
    setLoading(false);
    if (!result.success) { setServerError(result.message); return; }
    navigate(`/${result.user.role}`, { replace: true });
  };

  const selectedRole = ROLES.find((r) => r.id === role);

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{fontFamily:'Inter, system-ui, sans-serif'}}>
      {/* Left panel — Branding */}
      <div className="hidden lg:flex w-[46%] relative overflow-hidden flex-col" style={{background:'linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #1a0f3c 100%)'}}>
        <div className="absolute inset-0 bg-dots opacity-15" />
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl" />

        <div className="relative flex-1 flex flex-col justify-between p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-2xl shadow-lg">
              🛍️
            </div>
            <div>
              <p className="text-xl font-black text-white" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>NearBuy</p>
              <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Local Pickup Platform</p>
            </div>
          </div>

          {/* Main message */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-white leading-tight" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
                Shop local.<br />
                <span style={{background:'linear-gradient(90deg,#fb923c,#f43f5e)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'}}>
                  Pick up today.
                </span>
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Discover products at nearby stores, book instantly, and collect with a secure 4-digit PIN. Zero delivery fees.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: '📍', title: 'Hyperlocal Discovery', desc: 'Find products within your neighbourhood.' },
                { icon: '⚡', title: 'Instant Booking', desc: 'Reserve items in seconds, pick up same day.' },
                { icon: '🔐', title: 'Secure PIN Checkout', desc: 'Only you can collect with your unique code.' },
              ].map(f => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-base shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="text-xs text-gray-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-white/6 border border-white/12 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => <span key={i} className="text-orange-400 text-sm">★</span>)}
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              "Ordered a protein supplement and picked it up in 20 minutes. No delivery fee, no wait. NearBuy is amazing!"
            </p>
            <div className="flex items-center gap-2.5 mt-4">
              <div className="w-8 h-8 rounded-xl bg-blue-500/30 border border-blue-500/20 flex items-center justify-center text-base">👩‍💼</div>
              <div>
                <p className="text-xs font-bold text-white">Priya Sharma</p>
                <p className="text-[10px] text-gray-500">Regular buyer · Bangalore</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — Register form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-650 flex items-center justify-center text-xl">🛍️</div>
            <span className="text-xl font-black text-gray-900" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>NearBuy</span>
          </div>

          <div className="space-y-7">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-black text-gray-900" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>Create account</h1>
              <p className="text-gray-500 mt-1.5 text-sm">
                {step === 1 ? 'How will you use NearBuy?' : `Registering as a ${role}`}
              </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-3">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                    step > s
                      ? 'bg-violet-600 text-white border-violet-600'
                      : step === s
                      ? 'bg-white text-violet-600 border-violet-600'
                      : 'bg-white text-gray-400 border-gray-200'
                  }`}>
                    {step > s ? '✓' : s}
                  </div>
                  {s < 2 && <div className={`flex-1 h-0.5 transition-all rounded-full ${step > 1 ? 'bg-violet-600' : 'bg-gray-200'}`} />}
                </React.Fragment>
              ))}
              <span className="text-xs text-gray-400 ml-1 font-medium">Step {step} of 2</span>
            </div>

            {/* Step 1 — Role Selection */}
            {step === 1 && (
              <div className="space-y-3 animate-fade-in">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    id={`role-${r.id}`}
                    onClick={() => handleRoleSelect(r.id)}
                    className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-150 bg-gradient-to-r ${r.gradient} ${r.border} hover:shadow-md hover:scale-[1.01] active:scale-[0.99] group`}
                  >
                    <span className="text-3xl mt-0.5">{r.icon}</span>
                    <div className="text-left flex-1">
                      <p className={`font-bold text-base ${r.text}`}>{r.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{r.desc}</p>
                    </div>
                    <span className={`ml-auto mt-1 ${r.text} text-xl group-hover:translate-x-1 transition-transform`}>→</span>
                  </button>
                ))}
                <p className="text-center text-sm text-gray-500 pt-2">
                  Already have an account?{' '}
                  <Link to="/login" className="text-violet-600 hover:text-violet-700 font-bold">Log in →</Link>
                </p>
              </div>
            )}

            {/* Step 2 — Details Form */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
                {/* Role indicator */}
                {selectedRole && (
                  <div className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${selectedRole.gradient} border ${selectedRole.border}`}>
                    <span className="text-2xl">{selectedRole.icon}</span>
                    <div>
                      <p className={`text-sm font-bold ${selectedRole.text}`}>{selectedRole.title}</p>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs text-gray-500 hover:text-gray-705 underline underline-offset-2 transition-colors font-semibold"
                      >
                        Change role
                      </button>
                    </div>
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="label-base">Full Name *</label>
                  <input
                    id="register-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Arjun Mehra"
                    className={`input-lg ${fieldErrors.name ? 'border-rose-400 focus:border-rose-500' : ''}`}
                    autoFocus
                  />
                  {fieldErrors.name && <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">⚠ {fieldErrors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="label-base">Email Address *</label>
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={`input-lg ${fieldErrors.email ? 'border-rose-400 focus:border-rose-500' : ''}`}
                  />
                  {fieldErrors.email && <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">⚠ {fieldErrors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="label-base">
                    Password * <span className="text-gray-400 font-normal">(min. 6 characters)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="register-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`input-lg pr-12 ${fieldErrors.password ? 'border-rose-400 focus:border-rose-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650 transition-colors p-1"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">⚠ {fieldErrors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="label-base">Confirm Password *</label>
                  <div className="relative">
                    <input
                      id="register-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`input-lg pr-12 ${fieldErrors.confirmPassword ? 'border-rose-400 focus:border-rose-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650 transition-colors p-1"
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">⚠ {fieldErrors.confirmPassword}</p>}
                </div>

                {/* Phone (optional) */}
                <div>
                  <label className="label-base">
                    Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="register-phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="input-lg"
                  />
                </div>

                {/* Server error */}
                {serverError && (
                  <div className="flex items-center gap-2 text-rose-700 text-sm bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                    <span>⚠️</span> {serverError}
                  </div>
                )}

                <button
                  type="submit"
                  id="register-submit"
                  disabled={loading}
                  className="w-full btn-primary-lg justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating account…
                    </>
                  ) : 'Create Account →'}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Already have an account?{' '}
                  <Link to="/login" className="text-violet-600 hover:text-violet-700 font-bold">Log in →</Link>
                </p>

                <p className="text-center text-[11px] text-gray-400 leading-relaxed">
                  By registering you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
