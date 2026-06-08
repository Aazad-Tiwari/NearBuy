import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { buyerAPI } from '../../services/api';
import { useApp } from '../../context/AppContext';
import ProductCard from '../../components/buyer/ProductCard';
import BookingModal from '../../components/buyer/BookingModal';

export default function ShopDetailPage() {
  const { id } = useParams();
  const { notify } = useApp();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'priceAsc', 'priceDesc', 'rating'
  const [filterAvailability, setFilterAvailability] = useState('all'); // 'all', 'inStock'
  const [bookingProduct, setBookingProduct] = useState(null);

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true);
        const res = await buyerAPI.getShopDetails(id);
        if (res.success) {
          setShop(res.shop);
          setProducts(res.products || []);
        }
      } catch (err) {
        console.error('Failed to load shop details:', err);
        notify('error', 'Error fetching store details.');
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id, notify]);

  // Filter & Sort logic
  const filteredProducts = products
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStock = filterAvailability === 'inStock' ? p.stock > 0 : true;
      return matchesSearch && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'priceAsc') return a.price - b.price;
      if (sortBy === 'priceDesc') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-6 w-24 bg-slate-200 rounded-lg" />
        <div className="card p-6 h-48 bg-white border-slate-100" />
        <div className="h-10 w-full sm:w-1/3 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-64 bg-white border-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <p className="text-4xl mb-4">🏪</p>
        <h2 className="text-xl font-extrabold text-slate-800">Store Not Found</h2>
        <p className="text-slate-550 text-sm mt-1">This store is either inactive, pending verification, or does not exist.</p>
        <Link to="/buyer" className="btn-primary mt-6">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-2 animate-fade-in">
      {/* Breadcrumbs / Back button */}
      <div>
        <Link to="/buyer" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wider">
          ← Back to Discover
        </Link>
      </div>

      {/* Shop Info Card */}
      <div className="card bg-white border-slate-200/60 p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/40 rounded-full blur-3xl -z-10" />

        <div className="space-y-4 flex-1">
          {/* Shop name and badges */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
              {shop.name}
            </h1>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full uppercase tracking-wider">
              {shop.category}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border ${shop.isOpen ? 'text-emerald-700 bg-emerald-50 border-emerald-150' : 'text-rose-600 bg-rose-50 border-rose-150'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${shop.isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {shop.isOpen ? 'Open Now' : 'Closed Now'}
            </span>
          </div>

          {/* Description */}
          {shop.description && (
            <p className="text-slate-550 text-sm leading-relaxed max-w-2xl font-medium">
              {shop.description}
            </p>
          )}

          {/* Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm text-slate-600 pt-2">
            <div className="flex items-start gap-2">
              <span className="text-base">📍</span>
              <div>
                <p className="font-bold text-slate-750">Address</p>
                <p className="text-xs text-slate-450 mt-0.5 leading-relaxed">
                  {shop.address.street}, {shop.address.city}, {shop.address.state} — {shop.address.zipCode}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-base">🕐</span>
              <div>
                <p className="font-bold text-slate-750">Store Hours</p>
                <p className="text-xs text-slate-450 mt-0.5">{shop.openingHours || '9:00 AM - 7:00 PM'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-base">★</span>
              <div>
                <p className="font-bold text-slate-750">Store Rating</p>
                <div className="flex items-center gap-1 text-xs text-slate-450 mt-0.5">
                  <span className="font-bold text-amber-600">★ {shop.rating ? shop.rating.toFixed(1) : '0.0'}</span>
                  <span>({shop.reviewCount || 0} customer reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info Card */}
        <div className="md:w-72 shrink-0 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shop Contact Info</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shadow-sm">👤</span>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 font-medium">Owner</p>
                  <p className="text-xs font-bold text-slate-750 truncate">{shop.email ? shop.email.split('@')[0] : 'Shopkeeper'}</p>
                </div>
              </div>

              {shop.phone && (
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shadow-sm">📞</span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 font-medium">Phone Number</p>
                    <p className="text-xs font-bold text-slate-750">{shop.phone}</p>
                  </div>
                </div>
              )}

              {shop.email && (
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shadow-sm">✉️</span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 font-medium">Email Address</p>
                    <p className="text-xs font-bold text-slate-750 truncate" title={shop.email}>{shop.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Delivery Support:</span>
            {shop.deliverySettings?.isEnabled ? (
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10px]">Enabled</span>
            ) : (
              <span className="text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px]">Pickup Only</span>
            )}
          </div>
        </div>
      </div>

      {/* Catalog Search & Filtering */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search items in this store..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base pl-9 placeholder:text-slate-400 w-full"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:justify-end">
          {/* Availability */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 shrink-0 text-xs">
            <button
              onClick={() => setFilterAvailability('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${filterAvailability === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-805'}`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilterAvailability('inStock')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${filterAvailability === 'inStock' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-805'}`}
            >
              In Stock
            </button>
          </div>

          {/* Sort Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="select-base py-1.5 px-3 bg-white border-slate-250 text-xs font-bold w-auto shadow-sm"
          >
            <option value="name">Sort by: Name (A-Z)</option>
            <option value="priceAsc">Sort by: Price (Low to High)</option>
            <option value="priceDesc">Sort by: Price (High to Low)</option>
            <option value="rating">Sort by: Rating (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Catalog Results Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Product Catalog ({filteredProducts.length})</h2>

        {filteredProducts.length === 0 ? (
          <div className="card p-14 text-center border-slate-200 bg-white shadow-sm max-w-lg mx-auto">
            <p className="text-4xl mb-3">🧺</p>
            <p className="text-slate-800 font-bold text-sm">No items match your filters</p>
            <p className="text-slate-400 text-xs mt-1">Try clearing the search query or changing sorting options.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p) => (
              <ProductCard key={p._id} product={{ ...p, shopId: shop }} onBook={setBookingProduct} />
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal isOpen={!!bookingProduct} onClose={() => setBookingProduct(null)} product={bookingProduct} />
    </div>
  );
}
