import React from 'react';

/**
 * SearchBar — dual-mode product/store search input with toggle
 */
export default function SearchBar({ query, onQueryChange, searchType, onTypeToggle, onSearch, loading }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      {/* Type Toggle */}
      <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 shrink-0">
        <button
          onClick={() => onTypeToggle('products')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
            searchType === 'products'
              ? 'bg-white text-blue-600 border border-slate-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-850'
          }`}
        >
          <span>📦</span> Products
        </button>
        <button
          onClick={() => onTypeToggle('stores')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
            searchType === 'stores'
              ? 'bg-white text-blue-600 border border-slate-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-850'
          }`}
        >
          <span>🏪</span> Stores
        </button>
      </div>

      {/* Search Input */}
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          id="buyer-search-input"
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={searchType === 'products' ? 'Search for products — earbuds, protein, shoes…' : 'Search stores by name, city, category…'}
          className="input-base pl-10 pr-4 placeholder:text-slate-400"
          autoFocus
        />
      </div>

      {/* Search Button */}
      <button
        onClick={onSearch}
        disabled={loading || !query.trim()}
        className="btn-primary flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
        id="buyer-search-btn"
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
        Search
      </button>
    </div>
  );
}
