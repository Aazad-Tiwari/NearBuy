import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import { useCart } from '../../context/CartContext';
import { useApp } from '../../context/AppContext';

const CATEGORY_STYLES = {
  Electronics: { gradient: 'from-blue-50/70 via-indigo-50/50 to-indigo-100/30 text-blue-600', emoji: '💻', border: 'border-blue-100/60' },
  Clothing: { gradient: 'from-pink-50/70 via-rose-50/50 to-rose-100/30 text-pink-650', emoji: '👗', border: 'border-pink-100/60' },
  Grocery: { gradient: 'from-emerald-50/70 via-teal-50/50 to-teal-100/30 text-emerald-600', emoji: '🥬', border: 'border-emerald-100/60' },
  Pharmacy: { gradient: 'from-red-50/70 via-orange-50/50 to-rose-100/30 text-rose-600', emoji: '💊', border: 'border-rose-100/60' },
  Books: { gradient: 'from-amber-50/70 via-orange-50/50 to-orange-100/30 text-amber-700', emoji: '📚', border: 'border-amber-100/60' },
  Sports: { gradient: 'from-violet-50/70 via-purple-50/50 to-fuchsia-100/30 text-violet-650', emoji: '⚽', border: 'border-violet-100/60' },
  'Home & Garden': { gradient: 'from-lime-50/70 via-green-50/50 to-emerald-100/30 text-emerald-705', emoji: '🏡', border: 'border-lime-100/60' },
  Toys: { gradient: 'from-sky-50/70 via-cyan-50/50 to-blue-100/30 text-sky-650', emoji: '🧸', border: 'border-sky-100/60' },
  'Food & Beverages': { gradient: 'from-yellow-50/70 via-amber-50/50 to-red-100/30 text-yellow-650', emoji: '🍽️', border: 'border-yellow-100/60' },
  Beauty: { gradient: 'from-purple-50/70 via-fuchsia-50/50 to-pink-100/30 text-purple-650', emoji: '💄', border: 'border-purple-100/60' },
  Other: { gradient: 'from-slate-50 via-slate-100 to-slate-200/50 text-slate-700', emoji: '🏪', border: 'border-slate-200/80' },
};

/**
 * ProductCard — displays a single product with shop info and Book button
 */
export default function ProductCard({ product, onBook }) {
  const { addToCart } = useCart();
  const { notify } = useApp();

  const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  const style = CATEGORY_STYLES[product.category] || CATEGORY_STYLES.Other;

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const res = addToCart(product, 1);
    if (res && res.conflict) {
      notify('info', 'Single-shop cart constraint. Opening product details...');
      window.location.hash = `/buyer/products/${product._id}`;
      window.location.href = `/buyer/products/${product._id}`;
    } else if (res && res.success) {
      notify('success', `Added "${product.name}" to cart.`);
    }
  };

  return (
    <div 
      className="card flex flex-col animate-fade-in overflow-hidden group hover:border-blue-500/25 hover:shadow-md transition-all duration-300 border-slate-200/65 bg-white shadow-sm" 
      id={`product-card-${product._id}`}
    >
      {/* Product Image / Category Gradient Header */}
      <Link to={`/buyer/products/${product._id}`} className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50 border-b border-slate-100 block">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            loading="lazy"
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}

        {/* Fallback & placeholder gradient */}
        <div 
          className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${style.gradient}`}
          style={{ display: product.imageUrl ? 'none' : 'flex' }}
        >
          <span className="text-5xl transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 filter drop-shadow-md">
            {style.emoji}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 opacity-60">
            {product.category}
          </span>
        </div>

        {/* Category Badge overlay */}
        <div className="absolute top-3 left-3 z-10">
          <span className="text-[9px] font-bold bg-white/95 backdrop-blur-md border border-slate-200/60 px-2.5 py-1 rounded-xl text-slate-700 uppercase tracking-wider shadow-sm">
            {product.category}
          </span>
        </div>

        {/* Stock Badge overlay */}
        <div className="absolute top-3 right-3 z-10">
          {product.shopId?.isOpen === false ? (
            <span className="text-[9px] font-bold bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-xl text-rose-650 shadow-sm">
              Closed
            </span>
          ) : isOutOfStock ? (
            <span className="text-[9px] font-bold bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-xl text-rose-600 shadow-sm">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="text-[9px] font-bold bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-xl text-amber-700 animate-pulse shadow-sm">
              Only {product.stock} Left
            </span>
          ) : (
            <span className="text-[9px] font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-xl text-emerald-700 shadow-sm">
              In Stock
            </span>
          )}
        </div>
      </Link>

      {/* Product Content Info */}
      <div className="p-5 flex flex-col flex-1 gap-3.5">
        {/* Name & Description */}
        <div className="space-y-1">
          <Link to={`/buyer/products/${product._id}`}>
            <h3 className="font-extrabold text-slate-800 text-sm md:text-base leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.rating > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-amber-500 text-xs">★</span>
              <span className="text-xs font-bold text-slate-700">{product.rating.toFixed(1)}</span>
              <span className="text-slate-400 text-[10px]">({product.reviewCount || 0})</span>
            </div>
          )}
          {product.description ? (
            <p className="text-xs text-slate-450 line-clamp-2 leading-relaxed h-8">
              {product.description}
            </p>
          ) : (
            <div className="h-8" />
          )}
        </div>

        {/* Store Profile Link Info */}
        {product.shopId && (
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
            <span className="text-base shrink-0">🏪</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate">{product.shopId.name}</p>
              {product.shopId.address && (
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {product.shopId.address.street}, {product.shopId.address.city}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Price & CTA Button */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
          <div>
            <p className="text-lg font-black text-slate-800 tracking-tight">{formatPrice(product.price)}</p>
            {product.sku && <p className="text-[9px] text-slate-400 font-mono mt-0.5">SKU: {product.sku}</p>}
          </div>
          <div className="flex gap-2">
            <Link to={`/buyer/products/${product._id}`}>
              <button className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm">
                Details
              </button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={handleQuickAdd}
              disabled={isOutOfStock || product.shopId?.isOpen === false}
              className="font-bold text-xs shadow-sm"
            >
              {product.shopId?.isOpen === false ? 'Closed' : isOutOfStock ? 'Unavailable' : '+ Cart'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
