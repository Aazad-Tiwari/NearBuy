import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { publicAPI } from '../services/api';

/* ── Animated counter hook ── */
function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

/* ── Landing Navbar ─────────────────────────────────────────────────────── */
function LandingNav() {
  const { isAuthenticated, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-400 ${scrolled ? 'nav-scrolled-dark' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-xl shadow-glow-orange group-hover:scale-105 transition-transform duration-200">
              🛍️
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>NearBuy</span>
              <div className="text-[9px] text-orange-400 font-bold uppercase tracking-widest leading-none">Local Pickup</div>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {[['#how-it-works','How It Works'],['#features','Features'],['#for-shopkeepers','For Shops']].map(([href, label]) => (
              <a key={href} href={href} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-xl hover:bg-white/8 transition-all duration-150 font-medium">
                {label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-400 font-medium">Hi, {user?.name?.split(' ')[0]} 👋</span>
                <Link to={`/${user?.role}`} className="btn-orange text-sm px-5 py-2">Go to Dashboard →</Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-300 hover:text-white font-medium px-4 py-2 rounded-xl hover:bg-white/8 transition-all">Log In</Link>
                <Link to="/register" className="btn-orange text-sm px-5 py-2.5">Get Started Free →</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-5 border-t border-white/10 space-y-1 animate-slide-down pt-4">
            {[['#how-it-works','How It Works'],['#features','Features'],['#for-shopkeepers','For Shops']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/8 rounded-xl transition-all">
                {label}
              </a>
            ))}
            <div className="flex gap-3 px-0 pt-3">
              <Link to="/login" className="btn-secondary text-sm flex-1">Log In</Link>
              <Link to="/register" className="btn-orange text-sm flex-1">Get Started</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

/* ── Hero Section ───────────────────────────────────────────────────────── */
function HeroSection({ shopsCount }) {
  const formatStatValue = (val, suffix = '+') => {
    if (val >= 1000) {
      return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}K${suffix}`;
    }
    return `${val}${suffix}`;
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden landing-bg">
      {/* Background layers */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute -top-40 -left-40 w-[800px] h-[800px] rounded-full bg-violet-700/12 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[600px] h-[600px] rounded-full bg-orange-600/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] rounded-full bg-blue-700/8 blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid lg:grid-cols-2 gap-12 items-center pt-28 pb-20">
        {/* Left — copy */}
        <div className="space-y-8 animate-fade-in-up">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2.5 bg-white/8 border border-white/12 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-sm font-semibold text-gray-200">{formatStatValue(shopsCount)} local shops live across India</span>
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white leading-[0.95]" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
              Shop Local.
            </h1>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] hero-gradient-text" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
              Pick Up Today.
            </h1>
          </div>

          <p className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-xl">
            Discover products at nearby stores, book them instantly, and collect with a <strong className="text-white font-semibold">secure 4-digit PIN</strong>. Zero delivery fees. Zero wait times.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <Link to="/register?role=buyer" className="btn-orange-lg group">
              Start Shopping
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </Link>
            <Link to="/register?role=shopkeeper" className="btn-outline-white-lg group">
              🏪 List Your Store
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap gap-6 pt-2">
            {[
              { icon: '✓', text: 'Zero delivery fees' },
              { icon: '✓', text: 'Same-day pickup' },
              { icon: '✓', text: 'Secure PIN checkout' },
              { icon: '✓', text: 'Free for buyers' },
            ].map((t) => (
              <div key={t.text} className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-400 font-bold shrink-0">
                  {t.icon}
                </span>
                {t.text}
              </div>
            ))}
          </div>
        </div>

        {/* Right — floating UI mockup */}
        <div className="relative hidden lg:flex items-center justify-center h-[540px] animate-fade-in-right">
          {/* Product card */}
          <div className="absolute top-4 right-4 w-72 bg-white/8 border border-white/15 backdrop-blur-lg rounded-2xl p-4 shadow-2xl animate-float-rotate">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 border border-blue-500/20 flex items-center justify-center text-2xl shrink-0">
                🎧
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-500 font-mono mb-0.5">SportsPro Arena · Whitefield</p>
                <p className="font-bold text-white text-sm">Sony WH-1000XM5</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-orange-400 font-black text-base">₹24,999</p>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">8 in stock</span>
                </div>
              </div>
            </div>
            <button className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 rounded-xl transition-colors">
              Book for Pickup →
            </button>
          </div>

          {/* PIN ticket card — glowing */}
          <div className="absolute bottom-12 left-0 w-[270px] bg-white/8 border border-white/15 backdrop-blur-lg rounded-2xl p-5 shadow-2xl animate-float-delayed" style={{boxShadow:'0 0 50px rgba(251,146,60,0.15), 0 20px 50px rgba(0,0,0,0.4)'}}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Pickup Ticket</p>
                <p className="text-xs text-gray-500 mt-0.5">Show at store counter</p>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full font-semibold">✓ Ready</span>
            </div>
            <div className="font-mono text-5xl font-black text-orange-400 tracking-[0.4em] text-center py-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
              4823
            </div>
            <p className="text-[10px] text-gray-600 mt-3 text-center">Expires in 47 minutes</p>
          </div>

          {/* Store card */}
          <div className="absolute top-44 left-6 w-54 bg-white/8 border border-white/12 backdrop-blur-lg rounded-2xl p-4 shadow-xl animate-float" style={{animationDelay:'0.5s'}}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/20 flex items-center justify-center text-xl">⚽</div>
              <div>
                <p className="text-sm font-bold text-white">SportsPro Arena</p>
                <p className="text-[10px] text-gray-500">Whitefield, Bangalore</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Open for Pickup
              </div>
              <span className="text-amber-400">★ 4.8</span>
            </div>
          </div>

          {/* Distance pill */}
          <div className="absolute top-0 left-24 bg-white/8 border border-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-bold text-gray-300 animate-bounce-subtle">
            📍 1.2 km away
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-gray-950/80 to-transparent pointer-events-none" />
    </section>
  );
}

/* ── Stats Section ──────────────────────────────────────────────────────── */
function StatsSection({ statsData }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const shops = useCountUp(statsData.shops, 1500, visible);
  const buyers = useCountUp(statsData.buyers, 1800, visible);
  const pickups = useCountUp(statsData.pickups, 2000, visible);

  const formatStatValue = (val, suffix = '+') => {
    if (val >= 1000) {
      return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}K${suffix}`;
    }
    return `${val}${suffix}`;
  };

  const stats = [
    { value: visible ? formatStatValue(shops) : '0+', label: 'Local Shops', icon: '🏪', color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/20 text-blue-400' },
    { value: visible ? formatStatValue(buyers) : '0+', label: 'Happy Buyers', icon: '😊', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/20 text-emerald-400' },
    { value: visible ? formatStatValue(pickups) : '0+', label: 'Pickups Done', icon: '✅', color: 'from-orange-500/20 to-amber-500/20 border-orange-500/20 text-orange-400' },
    { value: '₹0', label: 'Delivery Fee', icon: '🎉', color: 'from-violet-500/20 to-purple-500/20 border-violet-500/20 text-violet-400' },
  ];

  return (
    <section ref={ref} className="relative py-16 border-y border-white/6 landing-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className={`text-center p-6 rounded-2xl bg-gradient-to-br border backdrop-blur-sm ${s.color}`}>
              <p className="text-3xl mb-2">{s.icon}</p>
              <p className="text-3xl sm:text-4xl font-black text-white mb-1 font-display tracking-tight">{s.value}</p>
              <p className="text-sm text-gray-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ───────────────────────────────────────────────────────── */
function HowItWorksSection() {
  const steps = [
    { num: '01', icon: '🔍', title: 'Discover Nearby', desc: 'Search products or browse stores within your area. Real-time stock visibility — see what\'s actually available before you go.', color: 'from-blue-500 to-indigo-500' },
    { num: '02', icon: '📋', title: 'Book in Seconds', desc: 'Select quantity, choose pickup time, and confirm instantly. Your order is reserved — no waiting, no uncertainty.', color: 'from-orange-500 to-rose-500', featured: true },
    { num: '03', icon: '🏪', title: 'Pick Up With PIN', desc: 'Show your unique 4-digit verification PIN at the store counter and collect your items. Done in under 60 seconds.', color: 'from-violet-500 to-fuchsia-500' },
  ];

  return (
    <section id="how-it-works" className="py-28 relative landing-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-orange-500/15 border border-orange-500/25 rounded-full px-4 py-1.5 mb-5">
            <span className="text-orange-400 text-xs font-bold uppercase tracking-widest">How It Works</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
            Three steps.<br /><span className="hero-gradient-text">That's all.</span>
          </h2>
          <p className="text-gray-400 mt-5 max-w-xl mx-auto text-lg leading-relaxed">
            From search to pickup in under 60 seconds. No registration needed to browse.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {steps.map((step, idx) => (
            <div key={step.num}
              className={`relative p-8 rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                step.featured
                  ? 'bg-white/10 border-orange-500/30 shadow-lg shadow-orange-500/10'
                  : 'bg-white/5 border-white/10 hover:bg-white/8'
              }`}
            >
              {step.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                  Most Popular Step
                </div>
              )}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-3xl mb-6 shadow-lg`}>
                {step.icon}
              </div>
              <p className="text-xs font-mono text-gray-600 mb-2 font-bold">{step.num}</p>
              <h3 className="text-xl font-bold text-white mb-3" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features Section ───────────────────────────────────────────────────── */
function FeaturesSection() {
  const features = [
    { icon: '🚫', title: 'Zero Delivery Fees', desc: 'Keep 100% of what you spend on products. No hidden logistics charges, ever.', color: 'from-red-500 to-rose-500' },
    { icon: '⚡', title: 'Same-Day Pickup', desc: 'Book now and collect in as little as 1 hour. Slots available throughout the day.', color: 'from-amber-500 to-orange-500' },
    { icon: '🔐', title: 'Secure PIN Checkout', desc: 'Unique 4-digit verification ensures only you collect your order at the counter.', color: 'from-blue-500 to-indigo-500' },
    { icon: '📍', title: 'Hyperlocal Discovery', desc: 'Browse real inventory from stores within your city, sorted by actual distance.', color: 'from-emerald-500 to-teal-500' },
    { icon: '📱', title: 'Real-Time Status', desc: 'Track your order from "Pending" to "Ready for Pickup" with live status updates.', color: 'from-violet-500 to-purple-500' },
    { icon: '💙', title: 'Support Local', desc: 'Every purchase directly supports local shopkeepers and strengthens your community.', color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <section id="features" className="py-28 relative landing-bg">
      <div className="absolute inset-0 bg-dots opacity-20" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-violet-500/15 border border-violet-500/25 rounded-full px-4 py-1.5 mb-5">
            <span className="text-violet-400 text-xs font-bold uppercase tracking-widest">Platform Features</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
            Built for the<br /><span className="hero-gradient-text">real world.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title}
              className="group p-7 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all duration-300 hover:-translate-y-1.5 cursor-default"
            >
              <div className={`w-13 h-13 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}
                style={{width:'52px', height:'52px'}}>
                {f.icon}
              </div>
              <h3 className="font-bold text-white mb-2.5 text-lg" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── For Shopkeepers Section ────────────────────────────────────────────── */
function ForShopkeepersSection() {
  const benefits = [
    { icon: '⚡', text: 'List your store and products in minutes' },
    { icon: '📊', text: 'Accept and manage pickup orders from one dashboard' },
    { icon: '🔐', text: 'Verify customers with PIN — zero fraud risk' },
    { icon: '💰', text: 'No commission on sales. Flat free tier available.' },
    { icon: '🎯', text: 'Get discovered by thousands of buyers in your city' },
  ];

  return (
    <section id="for-shopkeepers" className="py-28 relative overflow-hidden landing-bg">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-violet-700/10 blur-[130px] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div className="space-y-7">
            <div>
              <div className="inline-flex items-center gap-2 bg-violet-500/15 border border-violet-500/25 rounded-full px-4 py-1.5 mb-5">
                <span className="text-violet-400 text-xs font-bold uppercase tracking-widest">For Shopkeepers</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
                Turn your store into a
                <br />
                <span className="text-gradient-shopkeeper">digital pickup point.</span>
              </h2>
              <p className="text-gray-400 mt-5 leading-relaxed text-lg">
                Reach buyers who are already looking for what you sell. No complex setup, no upfront cost — just submit your store for approval and start selling.
              </p>
            </div>

            <ul className="space-y-3.5">
              {benefits.map((b) => (
                <li key={b.text} className="flex items-center gap-3.5 text-gray-300">
                  <span className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-base shrink-0">
                    {b.icon}
                  </span>
                  <span className="text-sm font-medium">{b.text}</span>
                </li>
              ))}
            </ul>

            <Link to="/register?role=shopkeeper" className="btn-violet-lg w-fit">
              List Your Store Free →
            </Link>
          </div>

          {/* Right — live dashboard preview */}
          <div className="bg-white/5 border border-white/15 backdrop-blur-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/30 border border-violet-500/30 flex items-center justify-center text-xl">⚽</div>
                <div>
                  <p className="text-sm font-bold text-white">SportsPro Arena</p>
                  <p className="text-xs text-gray-500">Shopkeeper Dashboard</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 px-3 py-1 rounded-full font-bold">✅ Approved & Live</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { n: '3', l: 'Pending', c: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                { n: '1', l: 'Ready', c: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
                { n: '12', l: 'Products', c: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
              ].map((s) => (
                <div key={s.l} className={`rounded-xl p-3.5 text-center border ${s.c}`}>
                  <p className="text-2xl font-black font-display">{s.n}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-semibold">{s.l}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Recent Orders</p>
              {[
                { name: 'Arjun Mehra', amt: '₹6,998', status: 'pending', time: '2h', statusColor: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
                { name: 'Sneha Pillai', amt: '₹14,745', status: 'accepted', time: '1.5h', statusColor: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
                { name: 'Rohan Kumar', amt: '₹3,200', status: 'ready', time: '30m', statusColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
              ].map((o) => (
                <div key={o.name} className="flex items-center justify-between py-3 border-b border-white/6 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-200">{o.name}</p>
                    <p className="text-xs text-gray-500">Pickup in {o.time}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-emerald-400">{o.amt}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${o.statusColor}`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ───────────────────────────────────────────────────────── */
function TestimonialsSection() {
  const reviews = [
    { name: 'Priya Sharma', role: 'Regular Buyer', city: 'Koramangala, Bangalore', rating: 5, text: 'I ordered a protein supplement on the way to the gym and picked it up in 20 minutes! No delivery wait, no extra fee. NearBuy is a game changer.', avatar: '👩‍💼' },
    { name: 'Vikram Patel', role: 'Shop Owner', city: 'Whitefield, Bangalore', rating: 5, text: 'My sports store went digital in 2 days. I got 40+ orders in the first week through NearBuy without spending anything on marketing!', avatar: '👨‍🏪' },
    { name: 'Anjali Reddy', role: 'Frequent Shopper', city: 'Indiranagar, Bangalore', rating: 5, text: 'The PIN system is brilliant — no one else can pick up my order. And seeing real stock before I head to the store saves so much time.', avatar: '👩‍💻' },
  ];

  return (
    <section className="py-28 relative landing-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-orange-500/15 border border-orange-500/25 rounded-full px-4 py-1.5 mb-5">
            <span className="text-orange-400 text-xs font-bold uppercase tracking-widest">Customer Love</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
            Real people.<br /><span className="hero-gradient-text">Real results.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div key={r.name}
              className="p-7 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 flex flex-col gap-5"
            >
              <div className="flex items-center gap-1">
                {[...Array(r.rating)].map((_, i) => <span key={i} className="text-orange-400 text-lg">★</span>)}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed flex-1">"{r.text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-white/8">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xl">
                  {r.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{r.name}</p>
                  <p className="text-[11px] text-gray-500">{r.role} · {r.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA Section ────────────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="py-28 relative overflow-hidden landing-bg">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-rose-500/8 to-violet-500/10" />
      <div className="absolute inset-0 bg-dots opacity-15" />
      <div className="relative max-w-4xl mx-auto px-4 text-center space-y-8">
        <h2 className="text-5xl sm:text-6xl font-black text-white" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
          Ready to shop<br />
          <span className="hero-gradient-text">local?</span>
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Join thousands of buyers who skip delivery queues and pick up their orders the same day. It's completely free.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/register?role=buyer" className="btn-orange-lg group">
            Start Shopping — It's Free
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <Link to="/register?role=shopkeeper" className="btn-outline-white-lg">
            Register Your Store
          </Link>
        </div>
        <p className="text-gray-600 text-sm">No credit card required · Free forever for buyers</p>
      </div>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────────────────────── */
function FooterSection() {
  const cols = [
    { title: 'Product', links: ['How it Works', 'Features', 'Pricing', 'Roadmap'] },
    { title: 'For Stores', links: ['Register Store', 'Shopkeeper Guide', 'Approval Process', 'FAQs'] },
    { title: 'Company', links: ['About Us', 'Blog', 'Careers', 'Press Kit'] },
    { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Refund Policy'] },
  ];

  return (
    <footer className="border-t border-white/8 py-16 landing-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-14">
          <div className="col-span-2 md:col-span-1 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-lg">🛍️</div>
              <span className="text-lg font-black text-white" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>NearBuy</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
              Your neighbourhood local pickup marketplace. Connecting buyers and stores across India.
            </p>
            <div className="flex gap-2">
              {['𝕏','in','fb','ig'].map(s => (
                <div key={s} className="w-8 h-8 rounded-lg bg-white/6 border border-white/10 hover:bg-white/12 transition-colors cursor-pointer flex items-center justify-center text-gray-500 hover:text-white text-xs font-bold">
                  {s}
                </div>
              ))}
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-xs text-gray-600 hover:text-gray-300 transition-colors font-medium">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-700">© 2026 NearBuy. All rights reserved.</p>
          <p className="text-xs text-gray-700">Built with ❤️ for local communities across India</p>
        </div>
      </div>
    </footer>
  );
}

/* ── LandingPage ─────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [stats, setStats] = useState({ shops: 500, buyers: 10000, pickups: 50000 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await publicAPI.getStats();
        if (res.success && res.data) {
          setStats({
            shops: res.data.shops || 0,
            buyers: res.data.buyers || 0,
            pickups: res.data.pickups || 0,
          });
        }
      } catch (err) {
        console.error('Error fetching public stats:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="landing-bg text-white font-sans overflow-x-hidden">
      <LandingNav />
      <HeroSection shopsCount={stats.shops} />
      <StatsSection statsData={stats} />
      <HowItWorksSection />
      <FeaturesSection />
      <ForShopkeepersSection />
      <TestimonialsSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
