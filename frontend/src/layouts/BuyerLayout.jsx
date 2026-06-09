import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import NotificationsBell from '../components/common/NotificationsBell';

function LocationDropdown({ userLocation, setUserLocation }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('select'); // 'select' | 'manual'
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  
  // Manual inputs
  const [manualName, setManualName] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualError, setManualError] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        // Reset states when closed
        setMode('select');
        setGpsError('');
        setManualError('');
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleGeocode = async (name) => {
    if (!name || !name.trim()) return;
    setGeocoding(true);
    setManualError('');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name.trim())}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        setManualLat(parseFloat(data[0].lat).toFixed(6));
        setManualLng(parseFloat(data[0].lon).toFixed(6));
      } else {
        setManualError('Could not find coordinates for this location name.');
      }
    } catch (err) {
      console.error('[geocode]', err);
      setManualError('Failed to fetch coordinates automatically.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({
          name: 'Current Location',
          lat: latitude,
          lng: longitude,
        });
        setGpsLoading(false);
        setOpen(false);
      },
      (error) => {
        console.error(error);
        setGpsError('Failed to fetch location. Please enter manually.');
        setGpsLoading(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSaveManual = async (e) => {
    e.preventDefault();
    if (!manualName.trim()) {
      setManualError('Location name is required.');
      return;
    }

    let latNum = parseFloat(manualLat);
    let lngNum = parseFloat(manualLng);

    // If coordinates are missing, auto-geocode first
    if (isNaN(latNum) || isNaN(lngNum)) {
      setGeocoding(true);
      setManualError('');
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualName.trim())}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
          latNum = parseFloat(data[0].lat);
          lngNum = parseFloat(data[0].lon);
          setManualLat(latNum.toFixed(6));
          setManualLng(lngNum.toFixed(6));
        } else {
          setManualError('Could not find coordinates for this location name. Please enter manually.');
          setGeocoding(false);
          return;
        }
      } catch (err) {
        console.error('[geocode]', err);
        setManualError('Failed to fetch coordinates. Please enter manually.');
        setGeocoding(false);
        return;
      }
      setGeocoding(false);
    }

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setManualError('Latitude must be a number between -90 and 90.');
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setManualError('Longitude must be a number between -180 and 180.');
      return;
    }

    setUserLocation({
      name: manualName.trim(),
      lat: latNum,
      lng: lngNum,
    });
    setOpen(false);
    setMode('select');
    setManualName('');
    setManualLat('');
    setManualLng('');
    setManualError('');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2 transition-all max-w-[200px] group"
      >
        <span className="text-blue-500 text-sm">📍</span>
        <span className="text-sm font-semibold text-gray-700 truncate max-w-[130px]">
          {userLocation.name.split(',')[0]}
        </span>
        <svg className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-4 animate-scale-in">
          {mode === 'select' ? (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Location</p>
              
              <button
                onClick={handleUseGPS}
                disabled={gpsLoading}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-semibold text-xs transition-all"
              >
                <span className="flex items-center gap-2">
                  <span>📍</span>
                  {gpsLoading ? 'Detecting Location...' : 'Use Current Location'}
                </span>
                {gpsLoading && <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
              </button>

              {gpsError && <p className="text-[10px] text-rose-500 font-medium">{gpsError}</p>}

              <div className="relative flex py-1.5 items-center">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink mx-3 text-[9px] text-gray-300 font-bold uppercase tracking-wider">or</span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>

              <button
                onClick={() => setMode('manual')}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-all"
              >
                <span>✍️</span> Enter Coordinates Manually
              </button>

              <div className="mt-2 text-[10px] text-gray-400 font-medium border-t border-gray-50 pt-2.5 flex items-center gap-1.5">
                <span className="text-gray-500 font-bold">Current:</span>
                <span className="truncate max-w-[170px]" title={userLocation.name}>
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)} ({userLocation.name})
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveManual} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manual Entry</span>
                <button
                  type="button"
                  onClick={() => { setMode('select'); setManualError(''); }}
                  className="text-[10px] text-gray-400 hover:text-gray-600 font-semibold"
                >
                  Back
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Location Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => { setManualName(e.target.value); setManualError(''); }}
                      onBlur={() => handleGeocode(manualName)}
                      placeholder="e.g. Indiranagar, Bangalore"
                      className="w-full text-xs pl-3 pr-16 py-2 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all font-medium text-gray-800"
                    />
                    <button
                      type="button"
                      disabled={geocoding}
                      onClick={() => handleGeocode(manualName)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-blue-600 hover:text-blue-800 font-extrabold uppercase tracking-wider disabled:opacity-50"
                    >
                      {geocoding ? (
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                          Wait
                        </span>
                      ) : 'Locate'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Latitude</label>
                    <input
                      type="text"
                      value={manualLat}
                      onChange={(e) => { setManualLat(e.target.value); setManualError(''); }}
                      placeholder="e.g. 12.9784"
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all font-medium text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Longitude</label>
                    <input
                      type="text"
                      value={manualLng}
                      onChange={(e) => { setManualLng(e.target.value); setManualError(''); }}
                      placeholder="e.g. 77.6408"
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all font-medium text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {manualError && <p className="text-[10px] text-rose-500 font-medium leading-normal">{manualError}</p>}

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Apply Location
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function UserDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-sm">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:block text-sm font-semibold text-gray-700 max-w-[90px] truncate">{user?.name?.split(' ')[0]}</span>
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2 animate-scale-in">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
          </div>
          <div className="py-1.5">
            {[
              { to: '/buyer', icon: '🏠', label: 'Dashboard' },
              { to: '/buyer/tickets', icon: '🎟️', label: 'My Tickets' },
              { to: '/buyer/stores', icon: '🏪', label: 'Browse Stores' },
              { to: '/buyer/optimize', icon: '⚡', label: 'Optimizer' },
            ].map(item => (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium">
                <span>{item.icon}</span> {item.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-gray-50 pt-1.5">
            <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-semibold text-left">
              🚪 Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuyerLayout() {
  const { user, logout } = useAuth();
  const { buyerOrders, userLocation, setUserLocation } = useApp();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeTickets = buyerOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  const handleLogout = () => { logout(); navigate('/', { replace: true }); };

  const NAV_LINKS = [
    { to: '/buyer', label: 'Discover', icon: '🔍', end: true },
    { to: '/buyer/stores', label: 'Stores', icon: '🏪' },
    { to: '/buyer/optimize', label: 'Optimizer', icon: '⚡' },
    { to: '/buyer/tickets', label: 'My Tickets', icon: '🎟️', badge: activeTickets },
    { to: '/buyer/cart', label: 'Cart', icon: '🛒', badge: cartCount, badgeColor: 'bg-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 app-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            {/* Logo */}
            <Link to="/buyer" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-lg shadow-sm">
                🛍️
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-black text-gray-900" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>NearBuy</span>
                <span className="ml-2 text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-bold">BUYER</span>
              </div>
            </Link>

            {/* Location */}
            <LocationDropdown userLocation={userLocation} setUserLocation={setUserLocation} />

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1 flex-1">
              {NAV_LINKS.map(link => (
                <NavLink key={link.to} to={link.to} end={link.end}
                  className={({ isActive }) =>
                    `relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 border border-blue-100'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`
                  }
                >
                  {link.label}
                  {link.badge > 0 && (
                    <span className={`w-5 h-5 rounded-full ${link.badgeColor || 'bg-blue-600'} text-white text-[10px] font-black flex items-center justify-center shadow-sm`}>
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2 ml-auto">
              <NotificationsBell />
              <UserDropdown user={user} onLogout={handleLogout} />
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(v => !v)}
                className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 px-4 py-3 space-y-1 bg-white animate-slide-down">
            {NAV_LINKS.map(link => (
              <NavLink key={link.to} to={link.to} end={link.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <span>{link.icon}</span>
                {link.label}
                {link.badge > 0 && (
                  <span className={`ml-auto w-5 h-5 rounded-full ${link.badgeColor || 'bg-blue-600'} text-white text-[10px] font-black flex items-center justify-center`}>
                    {link.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
