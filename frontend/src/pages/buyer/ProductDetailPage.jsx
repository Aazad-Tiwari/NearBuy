import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import { buyerAPI } from '../../services/api';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { userLocation, notify } = useApp();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(-1);
  const [comparisons, setComparisons] = useState([]);
  const [loadingComparisons, setLoadingComparisons] = useState(true);

  // Cart conflict modal states
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictShopName, setConflictShopName] = useState('');
  const [conflictCallback, setConflictCallback] = useState(null);

  const formatPrice = (p) => `₹${p.toLocaleString('en-IN')}`;

  // Fetch product and comparisons
  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      setLoadingComparisons(true);
      try {
        // Find product in local list or search
        const res = await buyerAPI.search({ type: 'products', q: '' });
        if (res.success) {
          const match = res.results.find(p => p._id === id);
          if (match) {
            setProduct(match);
            
            // Fetch comparisons
            const compRes = await buyerAPI.comparePrices(id, {
              lat: userLocation.lat,
              lng: userLocation.lng
            });
            if (compRes.success) {
              setComparisons(compRes.results || []);
            }
          } else {
            notify('error', 'Product not found.');
          }
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
        setLoadingComparisons(false);
      }
    }
    fetchDetails();
  }, [id, userLocation, notify]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse py-6 max-w-5xl mx-auto">
        <div className="h-6 w-32 bg-slate-200 rounded-lg mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-80 bg-slate-100 rounded-2xl border border-slate-200" />
          <div className="space-y-4">
            <div className="h-10 bg-slate-200 rounded-xl w-3/4" />
            <div className="h-5 bg-slate-200 rounded-lg w-1/4" />
            <div className="h-24 bg-slate-200 rounded-xl w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-24 max-w-md mx-auto">
        <p className="text-4xl mb-4">⚠️</p>
        <p className="text-slate-800 font-extrabold text-sm">Product details unavailable.</p>
        <Link to="/buyer" className="btn-primary mt-6 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Get active pricing/stock depending on variant selection
  const hasVariants = product.variants && product.variants.length > 0;
  const activePrice = selectedVariantIdx > -1 ? product.variants[selectedVariantIdx].price : product.price;
  const activeStock = selectedVariantIdx > -1 ? product.variants[selectedVariantIdx].stock : product.stock;
  const activeSku = selectedVariantIdx > -1 ? product.variants[selectedVariantIdx].sku : product.sku;
  const activeVariantName = selectedVariantIdx > -1 ? product.variants[selectedVariantIdx].name : '';

  const isShopClosed = product.shopId?.isOpen === false;

  const handleAddToCart = (selectedProduct = product, variantName = activeVariantName) => {
    if (selectedProduct.shopId?.isOpen === false) {
      notify('error', 'This store is currently closed. You cannot add its items to the cart.');
      return;
    }
    const result = addToCart(selectedProduct, 1, variantName);
    if (result && result.conflict) {
      setConflictShopName(result.conflictingShopName);
      setConflictCallback(() => result.action);
      setConflictModalOpen(true);
    } else if (result && result.success) {
      notify('success', `Added "${selectedProduct.name}" to cart.`);
    }
  };

  const handleResolveConflict = () => {
    if (conflictCallback) {
      conflictCallback();
      setConflictModalOpen(false);
      notify('success', 'Cart cleared and item added!');
      navigate('/buyer/cart');
    }
  };

  return (
    <div className="space-y-10 animate-fade-in max-w-5xl mx-auto py-2">
      {/* Breadcrumb */}
      <Link to="/buyer" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wider">
        ← Back to Discovery
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Image Card */}
        <div className="card aspect-square bg-white border border-slate-200/60 flex items-center justify-center text-8xl shadow-sm relative overflow-hidden select-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/10 to-transparent pointer-events-none" />
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="filter drop-shadow-md">📦</span>
          )}
        </div>

        {/* Right: Product summary info */}
        <div className="flex flex-col justify-between py-2 space-y-6">
          <div className="space-y-4">
            <div>
              <Link to={`/buyer/shops/${product.shopId?._id}`} className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100/60 px-3 py-1 rounded-full inline-flex items-center gap-1.5 hover:bg-blue-100/50 transition-colors">
                🏪 {product.shopId?.name}
              </Link>
              <h1 className="text-2xl md:text-3.5xl font-extrabold text-slate-800 tracking-tight leading-tight mt-3">{product.name}</h1>
              
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-slate-450 font-bold">
                  Category: {product.category} {product.subCategory ? `· ${product.subCategory}` : ''}
                </span>
                {product.rating > 0 && (
                  <span className="flex items-center gap-1 text-xs font-extrabold text-amber-600 bg-amber-50 border border-amber-100/40 px-2 py-0.5 rounded-lg">
                    ★ {product.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            {/* Store Status Banner */}
            {isShopClosed && (
              <div className="bg-rose-50 border border-rose-150 rounded-2xl p-4 text-xs text-rose-700 font-bold flex items-start gap-2.5 shadow-sm">
                <span className="text-base leading-none">⚠️</span>
                <div>
                  <p className="font-extrabold">Store is Currently Closed</p>
                  <p className="text-[10px] text-rose-500/90 font-medium mt-0.5 leading-relaxed">
                    This store is closed. You can view specifications but ordering/cart additions are temporarily disabled.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-baseline gap-4 pt-1">
              <span className="text-3.5xl font-black text-slate-800">{formatPrice(activePrice)}</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                activeStock > 0 && !isShopClosed
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-rose-50 text-rose-650 border-rose-100'
              }`}>
                {isShopClosed ? 'Unavailable (Closed)' : activeStock > 0 ? `In Stock (${activeStock} units)` : 'Out of Stock'}
              </span>
            </div>

            <div className="space-y-1 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Store Pickup Timings</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">🕐 {product.shopId?.openingHours || '9:00 AM - 7:00 PM'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</p>
              <p className="text-xs sm:text-sm text-slate-550 leading-relaxed font-medium">{product.description || 'No description provided.'}</p>
            </div>

            {/* Variant selector */}
            {hasVariants && (
              <div className="space-y-2.5 pt-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Select Product Variant</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedVariantIdx(-1)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedVariantIdx === -1
                        ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Standard (Base)
                  </button>
                  {product.variants.map((v, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariantIdx(idx)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedVariantIdx === idx
                          ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {v.name} ({formatPrice(v.price)})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-150">
            <Button
              variant="primary"
              onClick={() => handleAddToCart()}
              disabled={activeStock <= 0 || isShopClosed}
              className="w-full sm:w-64 font-bold"
              icon="🛒"
            >
              {isShopClosed ? 'Store Closed' : activeStock <= 0 ? 'Out of Stock' : 'Add to Shopping Cart'}
            </Button>
          </div>
        </div>
      </div>

      {/* Price comparisons matrix */}
      <div className="space-y-4 pt-8 border-t border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Compare Prices Across Shops</h2>
          <p className="text-xs text-slate-500 mt-1">Check nearby physical verified stores showcasing this item catalog.</p>
        </div>

        {loadingComparisons ? (
          <div className="h-32 bg-slate-100 animate-pulse rounded-2xl border border-slate-200" />
        ) : comparisons.length <= 1 ? (
          <div className="card p-8 text-center text-slate-400 text-xs">
            No alternative shops currently sell this product in your area.
          </div>
        ) : (
          <div className="card overflow-hidden border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-5 py-4">🏪 Store & Location</th>
                    <th className="px-5 py-4 text-center">⭐ Rating</th>
                    <th className="px-5 py-4 text-center">📍 Distance</th>
                    <th className="px-5 py-4 text-center">📦 Stock</th>
                    <th className="px-5 py-4 text-center">💵 Price</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisons.map((comp) => {
                    const isCurrent = comp.shop._id === product.shopId?._id;
                    
                    // For other shops, we construct the product object so we can add it to cart
                    const otherProductObj = {
                      _id: comp._id,
                      name: comp.name,
                      price: comp.price,
                      stock: comp.stock,
                      variants: comp.variants,
                      shopId: {
                        _id: comp.shop._id,
                        name: comp.shop.name,
                        address: comp.shop.address,
                      }
                    };

                    return (
                      <tr key={comp._id} className={`hover:bg-slate-50 transition-colors ${
                        isCurrent ? 'bg-blue-50/30 font-semibold text-blue-750' : ''
                      }`}>
                        <td className="px-5 py-4">
                          <p className="text-slate-800 font-extrabold text-sm flex items-center gap-1.5">
                            {comp.shop.name} 
                            {isCurrent && (
                              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full ml-1">Current</span>
                            )}
                          </p>
                          <p className="text-slate-400 text-[10px] font-medium mt-0.5">{comp.shop.address.street}, {comp.shop.address.city}</p>
                        </td>
                        <td className="px-5 py-4 text-center text-amber-600 font-bold">
                          ★ {comp.shop.rating?.toFixed(1) || '0.0'}
                        </td>
                        <td className="px-5 py-4 text-center text-slate-600 font-semibold">
                          {comp.distance} km
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${
                            comp.stock > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {comp.stock > 0 ? `In Stock (${comp.stock})` : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center font-black text-emerald-700 text-sm">
                          {formatPrice(comp.price)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleAddToCart(otherProductObj, '')}
                            disabled={comp.stock <= 0}
                            className="bg-white hover:bg-blue-50 text-blue-600 disabled:opacity-50 border border-slate-200 hover:border-blue-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            Add to Cart
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Cart Conflict Modal */}
      <Modal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        title="⚠️ Cart Store Conflict"
        subtitle="You are adding items from a different store"
        size="sm"
      >
        <div className="space-y-5 py-2">
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Your cart already contains items from <span className="text-slate-800 font-bold">"{conflictShopName}"</span>.
            <br />
            Our rules mandate that one checkout booking can contain items from only <span className="text-blue-600 font-bold">one shop at a time</span>.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setConflictModalOpen(false)} className="flex-1 font-bold">
              Cancel
            </Button>
            <button
              onClick={handleResolveConflict}
              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs py-2.5 transition-all shadow-md"
            >
              Clear & Add Item
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
