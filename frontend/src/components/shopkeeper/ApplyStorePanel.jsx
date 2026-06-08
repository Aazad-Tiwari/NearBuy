import React, { useState } from 'react';
import Button from '../common/Button';
import { useApp } from '../../context/AppContext';
import { SHOP_CATEGORIES } from '../../data/mockData';

/**
 * ApplyStorePanel — shopkeeper store registration form
 *
 * FIX (Task 3): Location is NOT auto-fetched on mount to avoid the "stuck Fetching" bug.
 * Instead, the user explicitly clicks "Use Current Location" to trigger GPS.
 * Latitude and Longitude are now mandatory visible fields (Task 10).
 */

const INITIAL_FORM = {
  name: '', description: '', category: '',
  street: '', city: '', state: '', zipCode: '',
  phone: '', email: '', openingHours: '',
  lat: '', lng: '',
};

const INDIA_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const OPENING_HOURS_PRESETS = [
  '8:00 AM - 8:00 PM', '9:00 AM - 7:00 PM', '10:00 AM - 8:00 PM',
  '8:00 AM - 10:00 PM', '24 hours (Open)', 'Mon–Fri: 9 AM – 6 PM',
];

export default function ApplyStorePanel() {
  const { addShop } = useApp();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // GPS fetch states — NOT auto-triggered (fixes "stuck Fetching" bug)
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null); // null | 'success' | 'error'
  const [gpsMessage, setGpsMessage] = useState('');

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  // Explicit GPS button handler — only fires on user action
  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsMessage('Geolocation is not supported by this browser. Please enter coordinates manually.');
      return;
    }
    setGpsLoading(true);
    setGpsStatus(null);
    setGpsMessage('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm((f) => ({ ...f, lat: latitude.toFixed(6), lng: longitude.toFixed(6) }));
        setErrors((er) => ({ ...er, lat: '', lng: '' }));
        setGpsStatus('success');
        setGpsMessage(`📍 Detected: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setGpsLoading(false);
      },
      (error) => {
        let msg = 'Could not fetch your location.';
        if (error.code === 1) msg = 'Location access was denied. Please enable it in browser settings, or enter coordinates manually.';
        else if (error.code === 2) msg = 'Location unavailable. Check your GPS signal.';
        else if (error.code === 3) msg = 'Location request timed out. Try again.';
        setGpsStatus('error');
        setGpsMessage(msg);
        setGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Shop name is required.';
    if (!form.category) errs.category = 'Select a category.';
    if (!form.street.trim()) errs.street = 'Street address is required.';
    if (!form.city.trim()) errs.city = 'City is required.';
    if (!form.state) errs.state = 'State is required.';
    if (!form.zipCode.trim() || !/^\d{6}$/.test(form.zipCode)) errs.zipCode = 'Enter a valid 6-digit PIN code.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.lat || isNaN(parseFloat(form.lat))) errs.lat = 'Latitude is required. Use the GPS button or enter manually.';
    if (!form.lng || isNaN(parseFloat(form.lng))) errs.lng = 'Longitude is required. Use the GPS button or enter manually.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    addShop({
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      address: { street: form.street.trim(), city: form.city.trim(), state: form.state, zipCode: form.zipCode.trim(), country: 'India' },
      phone: form.phone,
      email: form.email,
      openingHours: form.openingHours || '9:00 AM - 7:00 PM',
      coordinates: [parseFloat(form.lng), parseFloat(form.lat)],
    });
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-4xl">✅</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Application Submitted!
          </h2>
          <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
            Your store registration is now pending admin review. You'll be notified once approved — typically within 24 hours.
          </p>
        </div>
        <div className="card p-5 w-full max-w-md text-left space-y-2.5 shadow-sm">
          {[
            { label: 'Store Name', value: form.name },
            { label: 'Category', value: form.category },
            { label: 'Location', value: `${form.city}, ${form.state}` },
            { label: 'GPS Coordinates', value: `${form.lat}, ${form.lng}` },
          ].map(f => (
            <div key={f.label} className="flex justify-between text-sm">
              <span className="text-gray-400">{f.label}</span>
              <span className="text-gray-900 font-medium">{f.value}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
            <span className="text-gray-400">Status</span>
            <span className="text-amber-600 font-semibold">⏳ Pending Review</span>
          </div>
        </div>
        <Button variant="secondary" onClick={() => { setSubmitted(false); setForm(INITIAL_FORM); setGpsStatus(null); }}>
          Submit Another Application
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Apply For Store
        </h2>
        <p className="text-gray-500 text-sm mt-1">Submit your physical store for registration on the NearBuy platform.</p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <span className="text-xl mt-0.5">ℹ️</span>
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">What happens next?</p>
          <ul className="text-blue-600 space-y-0.5 text-xs">
            <li>• Your application goes to the admin for review</li>
            <li>• Admin approves or rejects with a reason</li>
            <li>• Once approved, you can add products and start accepting orders</li>
          </ul>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-6 shadow-sm">
        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-bold text-violet-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            🏪 Store Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label-base">Store Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. TechZone Electronics" className="input-base" />
              {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
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
              <label className="label-base">Opening Hours</label>
              <select name="openingHours" value={form.openingHours} onChange={handleChange} className="select-base">
                <option value="">Select hours…</option>
                {OPENING_HOURS_PRESETS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="label-base">Store Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Describe your store, specialities, and what customers can expect…" className="input-base resize-none" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-bold text-violet-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            📍 Physical Address
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label-base">Street Address *</label>
              <input name="street" value={form.street} onChange={handleChange} placeholder="e.g. 42 MG Road, Ground Floor" className="input-base" />
              {errors.street && <p className="text-rose-500 text-xs mt-1">{errors.street}</p>}
            </div>
            <div>
              <label className="label-base">City *</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="Bangalore" className="input-base" />
              {errors.city && <p className="text-rose-500 text-xs mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="label-base">State *</label>
              <select name="state" value={form.state} onChange={handleChange} className="select-base">
                <option value="">Select state…</option>
                {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <p className="text-rose-500 text-xs mt-1">{errors.state}</p>}
            </div>
            <div>
              <label className="label-base">PIN Code *</label>
              <input name="zipCode" value={form.zipCode} onChange={handleChange} placeholder="560001" maxLength={6} className="input-base" />
              {errors.zipCode && <p className="text-rose-500 text-xs mt-1">{errors.zipCode}</p>}
            </div>
          </div>
        </div>

        {/* GPS Coordinates — Mandatory (Task 10) */}
        <div className="border-t border-gray-100 pt-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-bold text-violet-700 uppercase tracking-wider flex items-center gap-2">
              🗺️ GPS Coordinates *
            </h3>
            <p className="text-[10px] text-gray-400 font-medium">Required for distance-based discovery</p>
          </div>

          {/* GPS Button */}
          <button
            type="button"
            onClick={handleFetchLocation}
            disabled={gpsLoading}
            className={`w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl border font-semibold text-sm transition-all mb-4 ${
              gpsLoading
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-wait'
                : gpsStatus === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : gpsStatus === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                : 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100 hover:shadow-sm'
            }`}
          >
            {gpsLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Detecting your location…
              </>
            ) : (
              <>
                <span className="text-lg">📍</span>
                {gpsStatus === 'success' ? 'Location Detected ✓ (Click to Re-fetch)' : 'Use Current Location (GPS)'}
              </>
            )}
          </button>

          {/* GPS Status Message */}
          {gpsMessage && (
            <div className={`mb-4 text-xs px-4 py-2.5 rounded-xl border font-medium ${
              gpsStatus === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}>
              {gpsMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Latitude *</label>
              <input
                name="lat"
                type="number"
                step="0.000001"
                value={form.lat}
                onChange={handleChange}
                placeholder="e.g. 12.9348"
                className="input-base font-mono text-sm"
              />
              {errors.lat && <p className="text-rose-500 text-xs mt-1">{errors.lat}</p>}
            </div>
            <div>
              <label className="label-base">Longitude *</label>
              <input
                name="lng"
                type="number"
                step="0.000001"
                value={form.lng}
                onChange={handleChange}
                placeholder="e.g. 77.6245"
                className="input-base font-mono text-sm"
              />
              {errors.lng && <p className="text-rose-500 text-xs mt-1">{errors.lng}</p>}
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-mono">
            Reference: Koramangala (12.9348, 77.6245) · Whitefield (12.9698, 77.7499) · Indiranagar (12.9784, 77.6408)
          </p>
        </div>

        {/* Contact */}
        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-bold text-violet-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            📞 Contact Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-base">Phone Number</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className="input-base" />
            </div>
            <div>
              <label className="label-base">Store Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="store@example.com" className="input-base" />
              {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={() => { setForm(INITIAL_FORM); setGpsStatus(null); setGpsMessage(''); }}>
            Reset Form
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon="🚀">
            Submit Application
          </Button>
        </div>
      </form>
    </div>
  );
}
