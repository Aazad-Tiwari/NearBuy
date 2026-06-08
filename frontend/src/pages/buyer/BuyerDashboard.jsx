import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { buyerAPI } from '../../services/api';
import SearchBar from '../../components/buyer/SearchBar';
import ProductCard from '../../components/buyer/ProductCard';
import StoreCard from '../../components/buyer/StoreCard';
import BookingModal from '../../components/buyer/BookingModal';

const CATEGORIES = ['Grocery','Pharmacy','Electronics','Clothing','Books','Sports','Beauty','Toys','Home & Garden','Food & Beverages','Other'];

const CATEGORY_META = [
  { name: 'Grocery',     icon: '🥬', bg: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700 border-emerald-100', hover: 'hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700' },
  { name: 'Pharmacy',    icon: '💊', bg: 'bg-rose-500',    light: 'bg-rose-50 text-rose-700 border-rose-100',          hover: 'hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700' },
  { name: 'Electronics', icon: '💻', bg: 'bg-blue-500',    light: 'bg-blue-50 text-blue-700 border-blue-100',          hover: 'hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700' },
  { name: 'Clothing',    icon: '👗', bg: 'bg-pink-500',    light: 'bg-pink-50 text-pink-700 border-pink-100',          hover: 'hover:bg-pink-50 hover:border-pink-200 hover:text-pink-700' },
  { name: 'Books',       icon: '📚', bg: 'bg-amber-500',   light: 'bg-amber-50 text-amber-700 border-amber-100',       hover: 'hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700' },
  { name: 'Sports',      icon: '⚽', bg: 'bg-violet-500',  light: 'bg-violet-50 text-violet-700 border-violet-100',    hover: 'hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700' },
];

function GreetingHeader({ user, activeTickets }) {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const emoji = h < 12 ? '🌅' : h < 17 ? '☀️' : '🌙';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <p className="text-gray-400 text-sm font-medium">{greeting}, <span className="text-gray-600 font-semibold">{user?.name?.split(' ')[0]}</span> {emoji}</p>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-1" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
          Discover Local Stores
        </h1>
        <p className="text-gray-500 text-sm mt-1">Find products near you and pick up today — no delivery wait.</p>
      </div>
      {activeTickets > 0 && (
        <Link to="/buyer/tickets"
          className="flex items-center gap-3 bg-blue-600 text-white px-5 py-3 rounded-2xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg group shrink-0"
        >
          <span className="w-8 h-8 rounded-full bg-white/20 text-white text-sm font-black flex items-center justify-center animate-pulse">
            {activeTickets}
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-wide">Active Pickups</p>
            <p className="text-[11px] text-blue-200 group-hover:text-white transition-colors">View PIN code →</p>
          </div>
        </Link>
      )}
    </div>
  );
}

function HeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl mb-8" style={{
      background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)'
    }}>
      {/* Decorative elements */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/8 blur-2xl" />
      <div className="absolute -bottom-8 left-1/3 w-48 h-48 rounded-full bg-orange-500/15 blur-3xl" />
      <div className="absolute inset-0 bg-dots opacity-10" />

      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 p-8 sm:p-10">
        <div className="space-y-4 max-w-lg text-center sm:text-left">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">Live Inventory Near You</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
            Shop Local.
            <br />
            <span className="text-orange-300">Pick Up Today.</span>
          </h2>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            Search items in physical storefronts near you, book instantly, and pick up in minutes with a secure 4-digit PIN code.
          </p>
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            <Link to="/buyer/stores" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-all shadow-md">
              Browse Stores →
            </Link>
            <span className="inline-flex items-center gap-1.5 text-blue-200 text-xs font-medium py-2.5">
              ✓ Zero delivery fees &nbsp;·&nbsp; ✓ Instant confirmation
            </span>
          </div>
        </div>

        <div className="shrink-0 relative">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-white/15 border border-white/25 flex items-center justify-center text-6xl sm:text-7xl shadow-2xl backdrop-blur-sm animate-float">
            🛍️
          </div>
          <div className="absolute -top-3 -right-3 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
            500+ Shops
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryGrid({ onCategoryClick }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>Browse by Category</h2>
        <Link to="/buyer/stores" className="text-sm text-blue-600 font-semibold hover:underline">View All Stores →</Link>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {CATEGORY_META.map((cat) => (
          <button
            key={cat.name}
            onClick={() => onCategoryClick(cat.name)}
            className={`group flex flex-col items-center gap-2.5 p-4 rounded-2xl border bg-white text-gray-600 font-semibold text-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${cat.hover} border-gray-100`}
          >
            <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-200`}>
              {cat.icon}
            </div>
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-5 h-72 animate-pulse">
      <div className="h-36 bg-gray-100 rounded-xl mb-4" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="flex justify-between mt-4">
          <div className="h-5 bg-gray-100 rounded w-1/4" />
          <div className="h-8 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

export default function BuyerDashboard() {
  const { user } = useAuth();
  const { products, buyerOrders, userLocation } = useApp();

  const [query, setQuery]             = useState('');
  const [searchType, setSearchType]   = useState('products');
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [bookingProduct, setBookingProduct] = useState(null);
  const [searchResults, setSearchResults]   = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const [sortBy, setSortBy]                     = useState('distance');
  const [filterCategory, setFilterCategory]     = useState('');
  const [filterAvailability, setFilterAvailability] = useState('all');
  const [filterDelivery, setFilterDelivery]     = useState('all');
  const [minPrice, setMinPrice]                 = useState('');
  const [maxPrice, setMaxPrice]                 = useState('');
  const [showFilters, setShowFilters]           = useState(false);

  const activeTickets = buyerOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;
  const activeFiltersCount = (filterCategory ? 1 : 0) + (filterAvailability !== 'all' ? 1 : 0) + (filterDelivery !== 'all' ? 1 : 0) + (minPrice || maxPrice ? 1 : 0);

  const fetchRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const res = await buyerAPI.getRecommendations({ lat: userLocation.lat, lng: userLocation.lng });
      if (res.success) {
        setRecommendedProducts(res.products || []);
      }
    } catch (e) {
      console.error('Failed to fetch recommendations:', e);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [userLocation]);

  const doSearch = async (overrides = {}) => {
    setLoading(true);
    try {
      const params = { type: searchType, q: query, lat: userLocation.lat, lng: userLocation.lng, sortBy, ...overrides };
      if (filterCategory) params.category = filterCategory;
      if (filterAvailability === 'inStock') params.availability = 'true';
      if (filterDelivery === 'enabled') params.deliverySupport = 'true';
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const res = await buyerAPI.search(params);
      if (res.success) { setSearchResults(res.results || []); setHasSearched(true); }
    } catch (e) { console.error('Search failed:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (query.trim() || hasSearched) doSearch();
  }, [sortBy, filterCategory, filterAvailability, filterDelivery, searchType, userLocation]);

  const handleTagClick = async (term) => {
    setQuery(term);
    setSearchType('products');
    await doSearch({ type: 'products', q: term });
  };

  const resetFilters = () => {
    setSortBy('distance'); setFilterCategory(''); setFilterAvailability('all');
    setFilterDelivery('all'); setMinPrice(''); setMaxPrice('');
  };

  return (
    <div className="animate-fade-in">
      <GreetingHeader user={user} activeTickets={activeTickets} />
      <HeroBanner />

      {/* ── Search Box ──────────────────────────────────────────────────── */}
      <div className="card shadow-card mb-8 overflow-hidden">
        <div className="p-5 sm:p-6">
          <SearchBar
            query={query}
            onQueryChange={(v) => { setQuery(v); if (hasSearched) setHasSearched(false); }}
            searchType={searchType}
            onTypeToggle={(type) => { setSearchType(type); setHasSearched(false); setSearchResults([]); resetFilters(); }}
            onSearch={() => query.trim() && doSearch()}
            loading={loading}
          />

          {/* Filter bar — shown when searching */}
          {(query.trim() || hasSearched) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                      showFilters || activeFiltersCount > 0
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>⚙️</span> Filters {activeFiltersCount > 0 && <span className="bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{activeFiltersCount}</span>}
                  </button>
                  {activeFiltersCount > 0 && (
                    <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-red-500 font-semibold transition-colors underline underline-offset-2">
                      Clear All
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-400">Sort:</span>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-400 cursor-pointer"
                  >
                    <option value="distance">📍 Nearest First</option>
                    {searchType === 'products' && <option value="price">💰 Price: Low to High</option>}
                    <option value="rating">⭐ Top Rated</option>
                    <option value="popularity">🔥 Most Popular</option>
                  </select>
                </div>
              </div>

              {showFilters && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-5 animate-slide-down">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Category</label>
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="select-base text-xs bg-white">
                      <option value="">All Categories</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Preferences</label>
                    <div className="space-y-2.5">
                      {[
                        { label: 'In Stock Only', checked: filterAvailability === 'inStock', onChange: e => setFilterAvailability(e.target.checked ? 'inStock' : 'all') },
                        { label: 'Home Delivery', checked: filterDelivery === 'enabled', onChange: e => setFilterDelivery(e.target.checked ? 'enabled' : 'all') },
                      ].map(f => (
                        <label key={f.label} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700">
                          <input type="checkbox" checked={f.checked} onChange={f.onChange}
                            className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-0 cursor-pointer"
                          />
                          {f.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  {searchType === 'products' && (
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Price Range (₹)</label>
                      <div className="flex items-center gap-2">
                        <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="input-base text-xs py-1.5" />
                        <span className="text-gray-300 text-sm">—</span>
                        <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="input-base text-xs py-1.5" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Loading Skeletons ──────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── No Results ─────────────────────────────────────────────────── */}
      {hasSearched && !loading && searchResults.length === 0 && (
        <div className="card p-16 text-center max-w-md mx-auto shadow-card">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className="text-gray-900 font-bold text-lg mb-2" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>No results found</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            No {searchType} found for "<strong>{query}</strong>". Try adjusting filters or a different search term.
          </p>
          <button onClick={resetFilters} className="btn-primary mt-5 mx-auto text-sm">Clear Filters</button>
        </div>
      )}

      {/* ── Search Results ──────────────────────────────────────────────── */}
      {hasSearched && !loading && searchResults.length > 0 && (
        <div className="animate-fade-in space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-500">
              <span className="text-gray-900 font-bold">{searchResults.length}</span> {searchType} found near{' '}
              <span className="text-blue-600 font-bold">{userLocation.name.split(',')[0]}</span>
            </p>
            <button onClick={() => { setHasSearched(false); setSearchResults([]); setQuery(''); }}
              className="text-xs text-gray-400 hover:text-gray-600 font-semibold transition-colors"
            >
              ← Back to discover
            </button>
          </div>
          {searchType === 'products' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {searchResults.map(p => <ProductCard key={p._id} product={p} onBook={setBookingProduct} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {searchResults.map(s => <StoreCard key={s._id} shop={s} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Discovery View (no search active) ──────────────────────────── */}
      {!hasSearched && !loading && (
        <div className="animate-fade-in space-y-10">
          <CategoryGrid onCategoryClick={handleTagClick} />

          {/* Recommended products */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
                  🤖 Recommended For You
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">AI-personalized suggestions based on your search & purchase history in {userLocation.name.split(',')[0]}</p>
              </div>
              <button onClick={() => handleTagClick('')} className="text-sm text-blue-600 font-semibold hover:underline">
                View All →
              </button>
            </div>

            {loadingRecommendations ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="card p-5 animate-pulse space-y-4 border-gray-150">
                    <div className="bg-gray-100 h-40 w-full rounded-xl" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-8 bg-gray-100 rounded w-full mt-2" />
                  </div>
                ))}
              </div>
            ) : recommendedProducts.length === 0 ? (
              <div className="card p-14 text-center bg-gray-50">
                <p className="text-4xl mb-3">🏪</p>
                <p className="text-gray-600 font-semibold">No recommendations in your area yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {recommendedProducts.map(p => <ProductCard key={p._id} product={p} onBook={setBookingProduct} />)}
              </div>
            )}
          </div>

          {/* Quick search tags */}
          <div className="card p-5 shadow-card">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">🔥 Popular Searches</p>
            <div className="flex flex-wrap gap-2">
              {['Electronics', 'Medicine', 'Grocery', 'Protein', 'Cricket Bat', 'Books', 'Earphones', 'Vitamins', 'Shoes', 'Stationery'].map(term => (
                <button key={term} onClick={() => handleTagClick(term)}
                  className="px-4 py-2 rounded-full bg-gray-50 border border-gray-200 hover:border-blue-300 text-xs text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-all font-semibold shadow-sm"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <BookingModal isOpen={!!bookingProduct} onClose={() => setBookingProduct(null)} product={bookingProduct} />
    </div>
  );
}
