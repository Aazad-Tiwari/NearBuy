import React, { useState, useMemo } from 'react';
import SearchBar from './SearchBar';
import ProductCard from './ProductCard';
import StoreCard from './StoreCard';
import BookingModal from './BookingModal';
import PickupTickets from './PickupTickets';
import { useApp } from '../../context/AppContext';

const TABS = [
  { id: 'search', label: 'Search & Book', icon: '🔍' },
  { id: 'tickets', label: 'My Tickets', icon: '🎟️' },
];

export default function BuyerView() {
  const { products, shops, buyerOrders } = useApp();
  const [activeTab, setActiveTab] = useState('search');
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('products');
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingProduct, setBookingProduct] = useState(null);

  const activeTicketCount = buyerOrders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length;

  // Client-side search simulation
  const searchResults = useMemo(() => {
    if (!hasSearched || !query.trim()) return [];
    const regex = new RegExp(query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    if (searchType === 'products') {
      return products.filter(
        (p) => p.isActive !== false && (regex.test(p.name) || regex.test(p.description || '') || regex.test(p.category))
      );
    } else {
      return shops.filter(
        (s) => s.approvalStatus === 'approved' && (regex.test(s.name) || regex.test(s.description || '') || regex.test(s.category) || regex.test(s.address?.city || ''))
      );
    }
  }, [query, searchType, hasSearched, products, shops]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500)); // simulate network
    setHasSearched(true);
    setLoading(false);
  };

  const handleTypeToggle = (type) => {
    setSearchType(type);
    setHasSearched(false);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Page header */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-gradient-buyer">Discover Local Shops</h1>
            <p className="text-slate-400 mt-1 text-sm">Search products, book for pickup, show your PIN at the counter.</p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-2xl p-1 w-fit mb-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.id === 'tickets' && activeTicketCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-cyan-600 text-white text-[10px] font-bold">
                    {activeTicketCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Search Tab ─────────────────────────────────────────────── */}
          {activeTab === 'search' && (
            <div className="space-y-8 animate-fade-in">
              {/* Search bar */}
              <div className="card p-5">
                <SearchBar
                  query={query}
                  onQueryChange={(v) => { setQuery(v); if (hasSearched) setHasSearched(false); }}
                  searchType={searchType}
                  onTypeToggle={handleTypeToggle}
                  onSearch={handleSearch}
                  loading={loading}
                />
              </div>

              {/* Results */}
              {!hasSearched && (
                <div className="text-center py-16">
                  <p className="text-6xl mb-4">🛍️</p>
                  <h2 className="text-xl font-bold text-slate-300 mb-2">Find anything nearby</h2>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                    Search for a product like "headphones" or a store like "pharmacy" to discover what's available for same-day pickup.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {['electronics', 'protein', 'pharmacy', 'books', 'cricket bat'].map((term) => (
                      <button
                        key={term}
                        onClick={() => { setQuery(term); setSearchType('products'); setHasSearched(false); }}
                        className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700/60 text-xs text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30 hover:bg-slate-800 transition-colors capitalize"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasSearched && loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="card p-5 h-56 animate-pulse">
                      <div className="h-4 bg-slate-800 rounded-lg w-20 mb-3" />
                      <div className="h-5 bg-slate-800 rounded-lg w-3/4 mb-2" />
                      <div className="h-4 bg-slate-800 rounded-lg w-full mb-1" />
                      <div className="h-4 bg-slate-800 rounded-lg w-2/3" />
                    </div>
                  ))}
                </div>
              )}

              {hasSearched && !loading && searchResults.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="text-slate-300 font-semibold">No results for "{query}"</p>
                  <p className="text-slate-500 text-sm mt-1">Try different keywords or switch search type</p>
                </div>
              )}

              {hasSearched && !loading && searchResults.length > 0 && (
                <div>
                  <p className="text-sm text-slate-400 mb-4">
                    Found <span className="text-slate-200 font-semibold">{searchResults.length}</span>{' '}
                    {searchType === 'products' ? 'product' : 'store'}{searchResults.length !== 1 ? 's' : ''} for
                    <span className="text-cyan-400 font-medium"> "{query}"</span>
                  </p>
                  {searchType === 'products' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {searchResults.map((product) => (
                        <ProductCard
                          key={product._id}
                          product={product}
                          onBook={setBookingProduct}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.map((shop) => (
                        <StoreCard key={shop._id} shop={shop} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Tickets Tab ───────────────────────────────────────────── */}
          {activeTab === 'tickets' && (
            <div className="animate-fade-in">
              <PickupTickets />
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={!!bookingProduct}
        onClose={() => setBookingProduct(null)}
        product={bookingProduct}
      />
    </div>
  );
}
