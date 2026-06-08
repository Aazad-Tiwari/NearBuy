import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_CREDENTIALS = [
  { role: 'Buyer',      email: 'buyer@demo.com',      icon: '🛍️', gradient: 'from-blue-500 to-indigo-500',   text: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100 hover:border-blue-300' },
  { role: 'Shopkeeper', email: 'shopkeeper@demo.com',  icon: '🏪', gradient: 'from-violet-500 to-purple-500', text: 'text-violet-600', bg: 'bg-violet-50 border-violet-100 hover:border-violet-300' },
  { role: 'Admin',      email: 'admin@demo.com',       icon: '⚙️', gradient: 'from-amber-500 to-orange-500',  text: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100 hover:border-amber-300' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
    setError(''); setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) { setError(result.message); return; }
    navigate(`/${result.user.role}`, { replace: true });
  };

  const useDemoAccount = (demoEmail) => {
    setEmail(demoEmail); setPassword('demo1234'); setError('');
  };

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

      {/* Right panel — Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xl">🛍️</div>
            <span className="text-xl font-black text-gray-900" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>NearBuy</span>
          </div>

          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>Welcome back</h1>
            <p className="text-gray-500 mt-1.5 text-sm">Sign in to your NearBuy account</p>
          </div>

          {/* Demo accounts */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">⚡ Quick Demo Login</p>
            <div className="grid grid-cols-3 gap-2.5">
              {DEMO_CREDENTIALS.map((d) => (
                <button key={d.role} onClick={() => useDemoAccount(d.email)}
                  className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border text-xs font-bold transition-all hover:-translate-y-0.5 hover:shadow-sm ${d.bg} ${d.text}`}
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${d.gradient} flex items-center justify-center text-lg shadow-sm`}>
                    {d.icon}
                  </div>
                  {d.role}
                </button>
              ))}
            </div>
            {email && password === 'demo1234' && (
              <p className="text-[11px] text-gray-400 text-center bg-gray-50 border border-gray-100 rounded-xl px-4 py-2">
                ✅ Demo credentials filled — click <strong className="text-blue-600">Log In</strong> to continue
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">or use your account</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-base">Email address</label>
              <input id="login-email" type="email" autoComplete="email"
                value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com" className="input-lg"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label-base mb-0">Password</label>
                <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••" className="input-lg pr-12"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors text-base"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 text-red-700 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button id="login-submit" type="submit" disabled={loading}
              className="w-full btn-primary-lg justify-center mt-1"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : 'Sign In →'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
              Create account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
