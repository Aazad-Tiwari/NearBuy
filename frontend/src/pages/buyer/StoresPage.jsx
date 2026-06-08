import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { buyerAPI } from '../../services/api';

const CATEGORIES = ['Grocery','Pharmacy','Electronics','Clothing','Books','Sports','Beauty','Toys','Home & Garden','Food & Beverages'];
const SORT_OPTIONS = [
  { value: 'distance', label: '📍 Nearest First' },
  { value: 'rating',   label: '⭐ Top Rated' },
  { value: 'popularity', label: '🔥 Most Popular' },
];
const CAT_ICONS = { Grocery:'🥬', Pharmacy:'💊', Electronics:'💻', Clothing:'👗', Books:'📚', Sports:'⚽', Beauty:'💄', Toys:'🧸', 'Home & Garden':'🌿', 'Food & Beverages':'🍴' };

function StoreDetailCard({ shop }) {
  const rating = shop.rating || 0;
  const distance = shop.distance != null ? `${shop.distance.toFixed(1)} km` : null;

  return (
    <Link
      to={`/buyer/shops/${shop._id}`}
      className="group card shadow-card hover:shadow-card-lg hover:-translate-y-1 transition-all duration-250 overflow-hidden flex flex-col"
    >
      {/* Image / Colored header */}
      <div className={`relative h-36 flex items-center justify-center text-6xl`}
        style={{
          background: `linear-gradient(135deg, ${getCategoryColor(shop.category)})`,
        }}
      >
        <div className="absolute inset-0 bg-dots opacity-20" />
        <span className="relative z-10 filter drop-shadow-lg text-7xl group-hover:scale-110 transition-transform duration-300">
          {CAT_ICONS[shop.category] || '🏪'}
        </span>
        {/* Status */}
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
          shop.isOpen !== false ? 'bg-emerald-500 text-white' : 'bg-gray-600 text-white'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${shop.isOpen !== false ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
          {shop.isOpen !== false ? 'Open' : 'Closed'}
        </div>
        {/* Distance badge */}
        {distance && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            📍 {distance}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Category badge */}
        <div className="flex items-center justify-between">
          <span className="badge badge-gray text-[10px]">{shop.category || 'General'}</span>
          {shop.deliverySettings?.isEnabled && (
            <span className="badge badge-blue text-[10px]">🛵 Delivery</span>
          )}
        </div>

        {/* Name */}
        <div>
          <h3 className="font-bold text-gray-900 text-base group-hover:text-blue-700 transition-colors leading-tight" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
            {shop.name}
          </h3>
          {shop.address && (
            <p className="text-gray-400 text-xs mt-1 font-medium">
              📍 {shop.address.street ? `${shop.address.street}, ` : ''}{shop.address.city}
            </p>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(s => (
              <span key={s} className={`text-sm ${s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
            ))}
          </div>
          <span className="text-sm font-bold text-gray-700">{rating > 0 ? rating.toFixed(1) : '—'}</span>
          {shop.reviewCount > 0 && (
            <span className="text-xs text-gray-400">({shop.reviewCount} reviews)</span>
          )}
        </div>

        {/* Opening hours */}
        {shop.openingHours && (
          <p className="text-xs text-gray-400 font-medium">🕐 {shop.openingHours}</p>
        )}

        {/* Description */}
        {shop.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">{shop.description}</p>
        )}

        {/* CTA */}
        <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">
            {shop.productCount > 0 ? `${shop.productCount} products` : 'View catalog'}
          </span>
          <span className="text-blue-600 text-xs font-bold group-hover:translate-x-1 transition-transform duration-200">
            Visit Store →
          </span>
        </div>
      </div>
    </Link>
  );
}

function getCategoryColor(category) {
  const colors = {
    Grocery: '#059669, #10b981',
    Pharmacy: '#dc2626, #ef4444',
    Electronics: '#2563eb, #3b82f6',
    Clothing: '#db2777, #ec4899',
    Books: '#d97706, #f59e0b',
    Sports: '#7c3aed, #8b5cf6',
    Beauty: '#be185d, #f472b6',
    Toys: '#ea580c, #fb923c',
    'Home & Garden': '#16a34a, #4ade80',
    'Food & Beverages': '#b45309, #f59e0b',
  };
  return colors[category] || '#4f46e5, #6366f1';
}

function FilterSidebar({ category, setCategory, sortBy, setSortBy, openOnly, setOpenOnly, deliveryOnly, setDeliveryOnly, minRating, setMinRating, onReset, activeCount }) {
  return (
    <aside className="w-72 shrink-0">
      <div className="card shadow-card sticky top-24 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-sm" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>Filters</h3>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </div>
          {activeCount > 0 && (
            <button onClick={onReset} className="text-xs text-red-500 font-semibold hover:underline transition-all">
              Reset All
            </button>
          )}
        </div>

        <div className="p-5 space-y-6">
          {/* Sort By */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Sort By</label>
            <div className="space-y-2">
              {SORT_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setSortBy(opt.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    sortBy === opt.value
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Category</label>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              <button onClick={() => setCategory('')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${!category ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                All Categories
              </button>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                    category === c ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{CAT_ICONS[c] || '🏪'}</span> {c}
                </button>
              ))}
            </div>
          </div>

          {/* Min Rating */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Minimum Rating</label>
            <div className="flex gap-1.5">
              {[0,3,4,4.5].map(r => (
                <button key={r} onClick={() => setMinRating(r)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    minRating === r
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-amber-200'
                  }`}
                >
                  {r === 0 ? 'Any' : `${r}★`}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Availability</label>
            <div className="space-y-3">
              {[
                { label: '🟢 Open Now', value: openOnly, onChange: setOpenOnly },
                { label: '🛵 Home Delivery', value: deliveryOnly, onChange: setDeliveryOnly },
              ].map(t => (
                <label key={t.label} className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-semibold text-gray-700">{t.label}</span>
                  <div
                    onClick={() => t.onChange(!t.value)}
                    className={`w-10 h-5.5 rounded-full relative cursor-pointer transition-colors duration-200 ${t.value ? 'bg-blue-600' : 'bg-gray-200'}`}
                    style={{width:'40px', height:'22px'}}
                  >
                    <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform duration-200 ${t.value ? 'translate-x-5' : 'translate-x-0.5'}`}
                      style={{width:'18px', height:'18px', top:'2px', left: t.value ? '20px' : '2px'}}
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function StoresPage() {
  const { userLocation } = useApp();

  const [shops, setShops]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [searchQ, setSearchQ]           = useState('');
  const [category, setCategory]         = useState('');
  const [sortBy, setSortBy]             = useState('distance');
  const [openOnly, setOpenOnly]         = useState(false);
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [minRating, setMinRating]       = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [totalFound, setTotalFound]     = useState(0);

  const activeCount = (category ? 1 : 0) + (openOnly ? 1 : 0) + (deliveryOnly ? 1 : 0) + (minRating > 0 ? 1 : 0);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        type: 'stores',
        q: searchQ,
        lat: userLocation.lat,
        lng: userLocation.lng,
        sortBy,
        limit: 50,
      };
      if (category)     params.category       = category;
      if (deliveryOnly) params.deliverySupport = 'true';
      if (openOnly)     params.availability    = 'true';

      const res = await buyerAPI.search(params);
      if (res.success) {
        let results = res.results || [];
        if (minRating > 0) results = results.filter(s => (s.rating || 0) >= minRating);
        setShops(results);
        setTotalFound(results.length);
      }
    } catch (e) { console.error('Failed to fetch stores:', e); }
    finally { setLoading(false); }
  }, [searchQ, category, sortBy, openOnly, deliveryOnly, minRating, userLocation]);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  const resetFilters = () => {
    setCategory(''); setSortBy('distance'); setOpenOnly(false);
    setDeliveryOnly(false); setMinRating(0);
  };

  return (
    <div className="animate-fade-in">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3 font-medium">
          <Link to="/buyer" className="hover:text-gray-600 transition-colors">Discover</Link>
          <span>›</span>
          <span className="text-gray-700 font-semibold">Browse Stores</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
              Local Stores Near You
            </h1>
            <p className="text-gray-500 text-sm mt-1.5">
              Showing stores near <span className="font-semibold text-blue-600">{userLocation.name.split(',')[0]}</span>
              {totalFound > 0 && <> · <span className="font-semibold text-gray-700">{totalFound} stores found</span></>}
            </p>
          </div>
          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`lg:hidden btn-secondary text-sm self-start sm:self-auto ${activeCount > 0 ? 'border-blue-300 text-blue-700 bg-blue-50' : ''}`}
          >
            ⚙️ Filters {activeCount > 0 && `(${activeCount})`}
          </button>
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="card shadow-card p-4 mb-6 flex gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchStores()}
            placeholder="Search stores by name, city, or category…"
            className="input-base pl-10 text-sm"
          />
        </div>
        <button onClick={fetchStores} className="btn-primary px-6 shrink-0">Search</button>
      </div>

      {/* ── Mobile Filters ───────────────────────────────────────────────── */}
      {showMobileFilters && (
        <div className="lg:hidden mb-6 card shadow-card p-4 animate-slide-down">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="select-base text-xs col-span-2 sm:col-span-1">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={category} onChange={e => setCategory(e.target.value)} className="select-base text-xs">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={minRating} onChange={e => setMinRating(Number(e.target.value))} className="select-base text-xs">
              <option value={0}>Any Rating</option>
              <option value={3}>3★ and above</option>
              <option value={4}>4★ and above</option>
              <option value={4.5}>4.5★ and above</option>
            </select>
          </div>
          <div className="flex gap-4 flex-wrap">
            {[{label:'Open Now', value: openOnly, set: setOpenOnly}, {label:'Home Delivery', value: deliveryOnly, set: setDeliveryOnly}].map(t => (
              <label key={t.label} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                <input type="checkbox" checked={t.value} onChange={e => t.set(e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                {t.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Layout ─────────────────────────────────────────────────── */}
      <div className="flex gap-6">
        {/* Sidebar — desktop only */}
        <div className="hidden lg:block">
          <FilterSidebar
            category={category} setCategory={setCategory}
            sortBy={sortBy} setSortBy={setSortBy}
            openOnly={openOnly} setOpenOnly={setOpenOnly}
            deliveryOnly={deliveryOnly} setDeliveryOnly={setDeliveryOnly}
            minRating={minRating} setMinRating={setMinRating}
            onReset={resetFilters}
            activeCount={activeCount}
          />
        </div>

        {/* Results grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card h-80 animate-pulse">
                  <div className="h-36 bg-gray-100 rounded-t-2xl" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : shops.length === 0 ? (
            <div className="card p-16 text-center shadow-card">
              <p className="text-5xl mb-4">🏪</p>
              <h3 className="font-bold text-gray-900 text-lg mb-2" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>No stores found</h3>
              <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
                {searchQ
                  ? `No stores match "${searchQ}". Try a different search term or clear your filters.`
                  : 'No stores available with the current filters. Try resetting them.'}
              </p>
              {activeCount > 0 && (
                <button onClick={resetFilters} className="btn-primary mt-5 mx-auto">Clear Filters</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {shops.map(shop => <StoreDetailCard key={shop._id} shop={shop} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
