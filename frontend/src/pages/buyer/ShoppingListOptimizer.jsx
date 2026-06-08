import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import { buyerAPI } from '../../services/api';
import Button from '../../components/common/Button';

export default function ShoppingListOptimizer() {
  const { userLocation, notify } = useApp();
  const { addToCart, clearCart } = useCart();
  const navigate = useNavigate();

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [hasOptimized, setHasOptimized] = useState(false);

  const formatPrice = (p) => `₹${p.toLocaleString('en-IN')}`;

  // Read upload text file
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setInputText(event.target.result);
      notify('success', 'Shopping list uploaded from file!');
    };
    reader.readAsText(file);
  };

  const handleOptimize = async () => {
    const items = inputText
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (items.length === 0) {
      notify('error', 'Please write or upload a list of items.');
      return;
    }

    setLoading(true);
    try {
      const res = await buyerAPI.optimizeShoppingList({
        items,
        lat: userLocation.lat,
        lng: userLocation.lng,
      });

      if (res.success) {
        setRecommendations(res.recommendations || []);
        setHasOptimized(true);
      }
    } catch (err) {
      notify('error', 'Failed to calculate optimal recommendations.');
      console.error('Optimization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadToCart = async (rec) => {
    try {
      // Clear current cart first
      clearCart();
      
      // Fetch the actual product details for each matched product
      // In this case, we have the productId and names. We can add them to cart
      // CartContext addToCart accepts: (product, quantity, variantName)
      // We will map matchedProducts to the format expected by CartContext
      for (const matched of rec.matchedProducts) {
        const fakeProduct = {
          _id: matched.productId,
          name: matched.name,
          price: matched.price,
          stock: matched.stock,
          imageUrl: matched.imageUrl,
          shopId: {
            _id: rec.shop._id,
            name: rec.shop.name,
            address: rec.shop.address,
            deliverySettings: rec.shop.deliverySettings
          }
        };
        addToCart(fakeProduct, 1);
      }
      
      notify('success', `Loaded ${rec.matchedProducts.length} items from "${rec.shop.name}" into cart.`);
      navigate('/buyer/cart');
    } catch (err) {
      notify('error', 'Failed to load list into cart.');
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-gradient-buyer">Shopping List Optimizer</h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload or write down your list, and we'll scan nearby stores to find the one that fulfills the most items at the best cost.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Input list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-slate-200 text-sm">Create Shopping List</h2>
            
            <textarea
              placeholder="Paste or write items (one per line)...&#10;e.g.&#10;organic milk&#10;paracetamol&#10;whey protein"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={12}
              className="input-base text-xs font-mono leading-relaxed resize-none"
            />

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-2">Or upload list (.txt)</label>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-350 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            <Button variant="primary" onClick={handleOptimize} loading={loading} className="w-full" icon="⚡">
              Optimize & Find Stores
            </Button>
          </div>
        </div>

        {/* Recommendations list */}
        <div className="lg:col-span-2 space-y-4">
          {!hasOptimized && !loading ? (
            <div className="card p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full min-h-[300px]">
              <span className="text-5xl mb-3">📋</span>
              <p className="text-slate-300 font-semibold text-sm">Ready to Optimize</p>
              <p className="text-slate-500 text-xs mt-1 max-w-xs leading-relaxed">
                Add items to your list on the left and click "Optimize" to view recommendations.
              </p>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="card p-6 h-48 animate-pulse space-y-3">
                  <div className="h-6 bg-slate-800 rounded w-1/3" />
                  <div className="h-4 bg-slate-800 rounded w-1/4" />
                  <div className="h-4 bg-slate-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="card p-12 text-center border-slate-800 text-slate-500 min-h-[300px] flex flex-col items-center justify-center">
              <span className="text-5xl mb-3">🔍</span>
              <p className="text-slate-350 font-bold text-sm">No Store Fulfills These Items</p>
              <p className="text-slate-550 text-xs mt-1">Try refining the names in your shopping list.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-base font-bold text-slate-200">Recommended Shops</h2>
              
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div
                    key={rec.shop._id}
                    className={`card p-6 border transition-all ${
                      index === 0
                        ? 'border-cyan-500/30 bg-gradient-to-r from-slate-900 via-cyan-950/5 to-slate-900 shadow-[0_6px_30px_rgba(6,182,212,0.05)]'
                        : 'border-slate-800/80 hover:border-slate-700/80'
                    }`}
                  >
                    {/* Badge for best match */}
                    {index === 0 && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full inline-block mb-3.5">
                        ⭐ Best Recommendation Fulfiller
                      </span>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      {/* Shop details */}
                      <div>
                        <h3 className="text-lg font-black text-slate-100 flex items-center gap-1.5">
                          {rec.shop.name}
                          <span className="text-amber-400 text-xs flex items-center gap-0.5 ml-1">
                            ⭐ {rec.shop.rating?.toFixed(1) || '0.0'}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {rec.shop.address.street}, {rec.shop.address.city} · {rec.shop.category}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 mt-3 text-xs font-semibold text-slate-300">
                          <span className="bg-slate-800 px-3 py-1.5 rounded-xl">📍 {rec.distance} km away</span>
                          <span className="bg-slate-800 px-3 py-1.5 rounded-xl text-emerald-400 font-bold">
                            💵 Est. Bill: {formatPrice(rec.estimatedBill)}
                          </span>
                          <span className="bg-slate-800 px-3 py-1.5 rounded-xl text-cyan-400">
                            ✓ Fulfills {rec.matchCount} / {rec.totalItems} items ({rec.matchPercentage}%)
                          </span>
                        </div>
                      </div>

                      {/* Convert to Cart Button */}
                      <Button
                        variant="primary"
                        onClick={() => loadToCart(rec)}
                        className="w-full sm:w-auto self-stretch sm:self-center"
                        icon="🛒"
                      >
                        Load to Cart
                      </Button>
                    </div>

                    {/* Items analysis breakdown */}
                    <div className="mt-5 pt-4 border-t border-slate-800/80">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Items Match Analysis</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {rec.matchedProducts.map((p) => (
                          <div key={p.productId} className="flex items-center gap-1.5 bg-emerald-500/5 border border-emerald-500/20 px-2.5 py-1 rounded-xl text-xs text-emerald-400">
                            <span className="text-[10px]">✓</span>
                            <span>{p.searchedItem}</span>
                            <span className="text-[10px] text-slate-500">({p.name} · {formatPrice(p.price)})</span>
                          </div>
                        ))}
                        
                        {rec.missingItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 bg-rose-500/5 border border-rose-500/20 px-2.5 py-1 rounded-xl text-xs text-rose-400">
                            <span className="text-[10px]">✗</span>
                            <span>{item}</span>
                            <span className="text-[10px] text-slate-500">(Out of stock)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
