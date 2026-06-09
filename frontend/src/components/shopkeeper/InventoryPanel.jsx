import React, { useState } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { SHOP_CATEGORIES } from '../../data/mockData';

const CATEGORY_STYLES = {
  Electronics: { emoji: '💻' },
  Clothing: { emoji: '👗' },
  Grocery: { emoji: '🥬' },
  Pharmacy: { emoji: '💊' },
  Books: { emoji: '📚' },
  Sports: { emoji: '⚽' },
  'Home & Garden': { emoji: '🏡' },
  Toys: { emoji: '🧸' },
  'Food & Beverages': { emoji: '🍽️' },
  Beauty: { emoji: '💄' },
  Other: { emoji: '🏪' },
};

const INITIAL_FORM = { name: '', description: '', price: '', stock: '', category: '', sku: '', imageUrl: '', subCategory: '' };

function formatPrice(p) {
  return `₹${Number(p).toLocaleString('en-IN')}`;
}

function StatusBadge({ isActive }) {
  if (isActive !== false) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-500">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Inactive
    </span>
  );
}

function ProductRow({ product, onEdit, onToggle, onDelete }) {
  const style = CATEGORY_STYLES[product.category] || CATEGORY_STYLES.Other;
  const hasVariants = product.variants && product.variants.length > 0;
  const isActive = product.isActive !== false;

  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors group ${!isActive ? 'opacity-60' : ''}`}>
      {/* Product Image & Details */}
      <td className="py-3.5 px-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                className="w-full h-full object-cover"
                alt=""
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <span className="text-2xl items-center justify-center" style={{ display: product.imageUrl ? 'none' : 'flex' }}>{style.emoji}</span>
          </div>

          <div className="min-w-0 space-y-1">
            <p className="text-sm font-bold text-gray-900 group-hover:text-violet-700 transition-colors truncate max-w-[200px]">{product.name}</p>
            {product.sku && <p className="text-[10px] font-mono text-gray-400">SKU: {product.sku}</p>}
            {hasVariants && (
              <div className="flex flex-wrap gap-1 mt-1">
                {product.variants.map((v, idx) => (
                  <span key={idx} className="text-[9px] bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded text-gray-500 font-mono shadow-sm">
                    {v.name} ({formatPrice(v.price)} - {v.stock}u)
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="py-3.5 px-5">
        <span className="text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-xl shadow-sm">
          {product.category}{product.subCategory ? ` (${product.subCategory})` : ''}
        </span>
      </td>
      <td className="py-3.5 px-5 text-sm font-extrabold text-gray-900">
        {formatPrice(product.price)}
        {hasVariants && <span className="text-[10px] text-gray-400 block font-normal">Base price</span>}
      </td>
      <td className="py-3.5 px-5">
        <span className={`text-xs font-bold ${
          product.stock === 0 ? 'text-rose-600' : product.stock <= 5 ? 'text-amber-600' : 'text-emerald-700'
        }`}>
          {product.stock === 0 ? 'Out of Stock' : `${product.stock} units`}
        </span>
      </td>
      <td className="py-3.5 px-5">
        <StatusBadge isActive={product.isActive} />
      </td>
      <td className="py-3.5 px-5">
        <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(product)}
            className="text-xs px-2.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-600 text-violet-600 hover:text-white border border-violet-200 hover:border-violet-600 transition-all font-semibold shadow-sm"
          >
            Edit
          </button>
          <button
            onClick={() => onToggle(product)}
            className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all font-semibold shadow-sm ${
              isActive
                ? 'bg-gray-50 hover:bg-gray-200 text-gray-600 border-gray-200'
                : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-200 hover:border-emerald-600'
            }`}
          >
            {isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => onDelete(product)}
            className="text-xs px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 transition-all font-semibold shadow-sm"
          >
            Remove
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function InventoryPanel() {
  const { products, shops, addProduct, updateProduct, deleteProduct, notify } = useApp();
  const myShop = shops[0] || null;

  const [form, setForm] = useState(INITIAL_FORM);
  const [variants, setVariants] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtering and Sorting States
  const [sortBy, setSortBy] = useState('name');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStock, setFilterStock] = useState('all');
  const [statusTab, setStatusTab] = useState('all'); // 'all' | 'active' | 'inactive'

  // Photo uploading states
  const [addingUploading, setAddingUploading] = useState(false);
  const [editUploading, setEditUploading] = useState(false);

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState(INITIAL_FORM);
  const [editVariants, setEditVariants] = useState([]);
  const [editErrors, setEditErrors] = useState({});

  // Deletion Confirmation State
  const [deletingProduct, setDeletingProduct] = useState(null);

  const handleConfirmDelete = async () => {
    if (deletingProduct) {
      await deleteProduct(deletingProduct._id);
      setDeletingProduct(null);
    }
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  const handleEditChange = (e) => {
    setEditForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setEditErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  // Variants handlers
  const addVariantField = () => setVariants(prev => [...prev, { name: '', price: '', stock: '', sku: '' }]);
  const updateVariantField = (idx, field, val) => setVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: val } : v));
  const removeVariantField = (idx) => setVariants(prev => prev.filter((_, i) => i !== idx));

  const addEditVariantField = () => setEditVariants(prev => [...prev, { name: '', price: '', stock: '', sku: '' }]);
  const updateEditVariantField = (idx, field, val) => setEditVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: val } : v));
  const removeEditVariantField = (idx) => setEditVariants(prev => prev.filter((_, i) => i !== idx));

  const validate = (formData, variantData) => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Product name is required.';
    if (formData.price === '' || isNaN(formData.price) || Number(formData.price) < 0) errs.price = 'Enter a valid price.';
    if (formData.stock === '' || isNaN(formData.stock) || Number(formData.stock) < 0) errs.stock = 'Enter a valid stock quantity.';
    if (!formData.category) errs.category = 'Select a category.';
    variantData.forEach((v, i) => {
      if (!v.name.trim()) errs[`var_${i}_name`] = 'Name required';
      if (v.price === '' || isNaN(v.price) || Number(v.price) < 0) errs[`var_${i}_price`] = 'Price error';
      if (v.stock === '' || isNaN(v.stock) || Number(v.stock) < 0) errs[`var_${i}_stock`] = 'Stock error';
    });
    return errs;
  };

  const handleAddClick = () => {
    if (myShop && myShop.approvalStatus !== 'approved') {
      notify('warning', 'Your store has not been approved yet. Products can only be added after admin approval.');
      return;
    }
    setShowForm(v => !v);
  };

  const handlePhotoUpload = async (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    if (isEdit) setEditUploading(true); else setAddingUploading(true);
    try {
      const token = localStorage.getItem('bopis_token');
      const uploadUrl = (import.meta.env.VITE_API_URL || '/api') + '/uploads';
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        if (isEdit) setEditForm(prev => ({ ...prev, imageUrl: resData.data.imageUrl }));
        else setForm(prev => ({ ...prev, imageUrl: resData.data.imageUrl }));
        notify('success', 'Photo uploaded successfully!');
      } else {
        notify('error', resData.message || 'Upload failed');
      }
    } catch (err) {
      notify('error', 'Network error uploading file');
    } finally {
      if (isEdit) setEditUploading(false); else setAddingUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form, variants);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    const formattedVariants = variants.map(v => ({
      name: v.name.trim(), price: parseFloat(v.price), stock: parseInt(v.stock), sku: v.sku.trim().toUpperCase()
    }));
    await addProduct({
      name: form.name.trim(), description: form.description.trim(), price: parseFloat(form.price),
      stock: parseInt(form.stock), category: form.category, subCategory: form.subCategory.trim(),
      sku: form.sku.trim().toUpperCase(), imageUrl: form.imageUrl.trim(), isActive: true, variants: formattedVariants
    });
    setForm(INITIAL_FORM); setVariants([]); setShowForm(false); setLoading(false);
  };

  const triggerEdit = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name, description: product.description || '', price: String(product.price),
      stock: String(product.stock), category: product.category, subCategory: product.subCategory || '',
      sku: product.sku || '', imageUrl: product.imageUrl || '',
    });
    setEditVariants(product.variants || []);
    setEditErrors({});
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(editForm, editVariants);
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setLoading(true);
    const formattedVariants = editVariants.map(v => ({
      name: v.name.trim(), price: parseFloat(v.price), stock: parseInt(v.stock), sku: (v.sku || '').trim().toUpperCase()
    }));
    await updateProduct({
      _id: editingProduct._id, name: editForm.name.trim(), description: editForm.description.trim(),
      price: parseFloat(editForm.price), stock: parseInt(editForm.stock), category: editForm.category,
      subCategory: editForm.subCategory.trim(), sku: editForm.sku.trim().toUpperCase(),
      imageUrl: editForm.imageUrl.trim(), isActive: editingProduct.isActive !== false, variants: formattedVariants
    });
    setEditingProduct(null); setLoading(false);
  };

  const handleToggle = async (product) => {
    const newState = !(product.isActive !== false);
    await updateProduct({ ...product, isActive: newState });
    notify(newState ? 'success' : 'info', newState ? `"${product.name}" is now active.` : `"${product.name}" has been deactivated.`);
  };

  // Counts for tabs
  const activeCount = products.filter(p => p.isActive !== false).length;
  const inactiveCount = products.filter(p => p.isActive === false).length;

  const filteredProducts = products
    .filter((p) => {
      const matchesSearch = !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = !filterCategory || p.category === filterCategory;
      let matchesStock = true;
      if (filterStock === 'inStock') matchesStock = p.stock > 0;
      else if (filterStock === 'outOfStock') matchesStock = p.stock === 0;
      else if (filterStock === 'lowStock') matchesStock = p.stock > 0 && p.stock <= 5;
      let matchesStatus = true;
      if (statusTab === 'active') matchesStatus = p.isActive !== false;
      else if (statusTab === 'inactive') matchesStatus = p.isActive === false;
      return matchesSearch && matchesCategory && matchesStock && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'priceAsc') return a.price - b.price;
      if (sortBy === 'priceDesc') return b.price - a.price;
      if (sortBy === 'stockAsc') return a.stock - b.stock;
      if (sortBy === 'stockDesc') return b.stock - a.stock;
      return 0;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Inventory Stock</h2>
          <p className="text-gray-500 text-sm mt-0.5">{products.length} products in catalogue</p>
        </div>
        <Button variant="primary" onClick={handleAddClick} icon={showForm ? '✕' : '➕'}>
          {showForm ? 'Cancel' : 'Add Product'}
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'all', label: `All (${products.length})` },
          { key: 'active', label: `Active (${activeCount})`, color: 'text-emerald-700' },
          { key: 'inactive', label: `Inactive (${inactiveCount})`, color: 'text-gray-500' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusTab(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusTab === tab.key
                ? 'bg-white shadow-sm text-gray-900'
                : `text-gray-500 hover:text-gray-700`
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add product form */}
      {showForm && (
        <div className="card p-6 border-violet-100 bg-violet-50/30 animate-slide-down">
          <h3 className="text-base font-bold text-violet-700 mb-5 flex items-center gap-2">➕ New Product Listing</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label-base">Product Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Organic Raw Honey" className="input-base" />
                {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="label-base">Base Price (₹) *</label>
                <input name="price" type="number" min="0" value={form.price} onChange={handleChange} placeholder="350" className="input-base" />
                {errors.price && <p className="text-rose-500 text-xs mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="label-base">Total Stock Units *</label>
                <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} placeholder="25" className="input-base" />
                {errors.stock && <p className="text-rose-500 text-xs mt-1">{errors.stock}</p>}
              </div>
              <div>
                <label className="label-base">Category *</label>
                <select name="category" value={form.category} onChange={handleChange} className="select-base">
                  <option value="">Select category…</option>
                  {SHOP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="text-rose-500 text-xs mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className="label-base">Subcategory (optional)</label>
                <input name="subCategory" value={form.subCategory} onChange={handleChange} placeholder="e.g. Sweeteners" className="input-base" />
              </div>
              <div>
                <label className="label-base">SKU (optional)</label>
                <input name="sku" value={form.sku} onChange={handleChange} placeholder="e.g. HONEY-RAW-350" className="input-base uppercase" />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="label-base">Product Photo</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-200 rounded-2xl">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Upload Image File</label>
                    <input
                      type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, false)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 text-xs text-gray-500 w-full cursor-pointer"
                    />
                    {addingUploading && <p className="text-[10px] text-blue-600 font-bold animate-pulse mt-1">Uploading…</p>}
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Or Paste Image URL</label>
                    <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://…" className="input-base text-xs" />
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="label-base">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Brief product description…" className="input-base resize-none" />
              </div>
            </div>

            {/* Variants */}
            <div className="border-t border-gray-100 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-violet-700 uppercase tracking-wider">📦 Product Variants</h4>
                <button type="button" onClick={addVariantField} className="text-xs bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-xl border border-gray-200 transition-all font-semibold">
                  ＋ Add Variant
                </button>
              </div>
              {variants.length > 0 ? (
                <div className="space-y-3">
                  {variants.map((v, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 bg-gray-50 p-4 border border-gray-200 rounded-xl">
                      <div className="flex-1 w-full">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Variant Name</label>
                        <input placeholder="e.g. 500g, Red / L" value={v.name} onChange={(e) => updateVariantField(idx, 'name', e.target.value)} className="input-base text-xs py-1.5" />
                        {errors[`var_${idx}_name`] && <p className="text-rose-500 text-[9px] mt-0.5">{errors[`var_${idx}_name`]}</p>}
                      </div>
                      <div className="w-full sm:w-28">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Price (₹)</label>
                        <input type="number" placeholder="Price" value={v.price} onChange={(e) => updateVariantField(idx, 'price', e.target.value)} className="input-base text-xs py-1.5" />
                        {errors[`var_${idx}_price`] && <p className="text-rose-500 text-[9px] mt-0.5">{errors[`var_${idx}_price`]}</p>}
                      </div>
                      <div className="w-full sm:w-28">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Stock</label>
                        <input type="number" placeholder="Stock" value={v.stock} onChange={(e) => updateVariantField(idx, 'stock', e.target.value)} className="input-base text-xs py-1.5" />
                        {errors[`var_${idx}_stock`] && <p className="text-rose-500 text-[9px] mt-0.5">{errors[`var_${idx}_stock`]}</p>}
                      </div>
                      <div className="w-full sm:w-36">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">SKU</label>
                        <input placeholder="SKU" value={v.sku} onChange={(e) => updateVariantField(idx, 'sku', e.target.value)} className="input-base text-xs py-1.5 uppercase" />
                      </div>
                      <button type="button" onClick={() => removeVariantField(idx)} className="text-rose-500 hover:text-rose-700 text-xs sm:mt-5 transition-colors self-end font-semibold">✕ Remove</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No variants added. Selling base product only.</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={loading}>Add to Catalogue</Button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 border border-gray-100 rounded-2xl shadow-sm">
        <div className="relative md:col-span-2">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, SKU or category…" className="input-base pl-10 text-xs w-full" />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="select-base text-xs py-1.5 w-full">
          <option value="">All Categories</option>
          {SHOP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select-base text-xs py-1.5 w-full">
          <option value="name">Sort: Name (A-Z)</option>
          <option value="priceAsc">Price: Low to High</option>
          <option value="priceDesc">Price: High to Low</option>
          <option value="stockAsc">Stock: Low to High</option>
          <option value="stockDesc">Stock: High to Low</option>
        </select>
      </div>

      {/* Products table */}
      <div className="card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
                <th className="text-left py-3 px-5 text-xs font-bold uppercase tracking-wider">Product</th>
                <th className="text-left py-3 px-5 text-xs font-bold uppercase tracking-wider">Category</th>
                <th className="text-left py-3 px-5 text-xs font-bold uppercase tracking-wider">Price</th>
                <th className="text-left py-3 px-5 text-xs font-bold uppercase tracking-wider">Stock</th>
                <th className="text-left py-3 px-5 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-5 text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <p className="text-4xl mb-3">📦</p>
                    <p className="font-semibold text-gray-700 text-sm">
                      {statusTab === 'inactive' ? 'No inactive products.' : statusTab === 'active' ? 'No active products.' : 'No products found.'}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {products.length === 0 ? 'Add your first product using the button above.' : 'Try adjusting filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <ProductRow key={product._id} product={product} onEdit={triggerEdit} onToggle={handleToggle} onDelete={setDeletingProduct} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {deletingProduct && (
        <Modal isOpen={!!deletingProduct} onClose={() => setDeletingProduct(null)} title="⚠️ Confirm Removal" subtitle={`Remove "${deletingProduct.name}" from catalogue?`} size="sm">
          <div className="space-y-4 pt-2">
            <p className="text-xs text-gray-500 leading-relaxed">
              This will soft-delete the product. Buyers won't be able to see or book this item. You can re-activate it later from the "Inactive" tab.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setDeletingProduct(null)} className="flex-1">Cancel</Button>
              <Button variant="danger" onClick={handleConfirmDelete} className="flex-1">Remove</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <Modal isOpen={!!editingProduct} onClose={() => setEditingProduct(null)} title="✏️ Edit Product" subtitle={editingProduct.name} size="md">
          <form onSubmit={handleEditSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label-base">Product Name *</label>
                <input name="name" value={editForm.name} onChange={handleEditChange} className="input-base" />
                {editErrors.name && <p className="text-rose-500 text-xs mt-1">{editErrors.name}</p>}
              </div>
              <div>
                <label className="label-base">Base Price (₹) *</label>
                <input name="price" type="number" min="0" value={editForm.price} onChange={handleEditChange} className="input-base" />
                {editErrors.price && <p className="text-rose-500 text-xs mt-1">{editErrors.price}</p>}
              </div>
              <div>
                <label className="label-base">Stock *</label>
                <input name="stock" type="number" min="0" value={editForm.stock} onChange={handleEditChange} className="input-base" />
                {editErrors.stock && <p className="text-rose-500 text-xs mt-1">{editErrors.stock}</p>}
              </div>
              <div>
                <label className="label-base">Category *</label>
                <select name="category" value={editForm.category} onChange={handleEditChange} className="select-base">
                  {SHOP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {editErrors.category && <p className="text-rose-500 text-xs mt-1">{editErrors.category}</p>}
              </div>
              <div>
                <label className="label-base">Subcategory</label>
                <input name="subCategory" value={editForm.subCategory} onChange={handleEditChange} className="input-base text-xs" />
              </div>
              <div>
                <label className="label-base">SKU</label>
                <input name="sku" value={editForm.sku} onChange={handleEditChange} className="input-base uppercase" />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="label-base">Product Photo</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-200 rounded-2xl">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Upload Image File</label>
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, true)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 text-xs text-gray-500 w-full cursor-pointer"
                    />
                    {editUploading && <p className="text-[10px] text-blue-600 font-bold animate-pulse mt-1">Uploading…</p>}
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Or Paste Image URL</label>
                    <input name="imageUrl" value={editForm.imageUrl} onChange={handleEditChange} className="input-base text-xs" />
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="label-base">Description</label>
                <textarea name="description" value={editForm.description} onChange={handleEditChange} rows={2} className="input-base resize-none" />
              </div>
            </div>

            {/* Variants (Edit) */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-violet-700 uppercase tracking-wider">📦 Product Variants</h4>
                <button type="button" onClick={addEditVariantField} className="text-xs bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-xl border border-gray-200 transition-all font-semibold">
                  ＋ Add Variant
                </button>
              </div>
              {editVariants.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {editVariants.map((v, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 bg-gray-50 p-4 border border-gray-200 rounded-xl">
                      <div className="flex-1 w-full">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Variant Name</label>
                        <input placeholder="e.g. 500g" value={v.name} onChange={(e) => updateEditVariantField(idx, 'name', e.target.value)} className="input-base text-xs py-1.5" />
                        {editErrors[`var_${idx}_name`] && <p className="text-rose-500 text-[9px] mt-0.5">{editErrors[`var_${idx}_name`]}</p>}
                      </div>
                      <div className="w-full sm:w-24">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Price (₹)</label>
                        <input type="number" value={v.price} onChange={(e) => updateEditVariantField(idx, 'price', e.target.value)} className="input-base text-xs py-1.5" />
                        {editErrors[`var_${idx}_price`] && <p className="text-rose-500 text-[9px] mt-0.5">{editErrors[`var_${idx}_price`]}</p>}
                      </div>
                      <div className="w-full sm:w-24">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Stock</label>
                        <input type="number" value={v.stock} onChange={(e) => updateEditVariantField(idx, 'stock', e.target.value)} className="input-base text-xs py-1.5" />
                        {editErrors[`var_${idx}_stock`] && <p className="text-rose-500 text-[9px] mt-0.5">{editErrors[`var_${idx}_stock`]}</p>}
                      </div>
                      <div className="w-full sm:w-32">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">SKU</label>
                        <input value={v.sku || ''} onChange={(e) => updateEditVariantField(idx, 'sku', e.target.value)} className="input-base text-xs py-1.5 uppercase" />
                      </div>
                      <button type="button" onClick={() => removeEditVariantField(idx)} className="text-rose-500 hover:text-rose-700 text-xs sm:mt-5 transition-colors self-end font-semibold">✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No variants added.</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="secondary" onClick={() => setEditingProduct(null)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={loading}>Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
