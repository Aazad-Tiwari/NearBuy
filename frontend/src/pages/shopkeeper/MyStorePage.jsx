import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { shopkeeperAPI } from '../../services/api';
import Button from '../../components/common/Button';
import ApplyStorePanel from '../../components/shopkeeper/ApplyStorePanel';

const STATUS_INFO = {
  approved: { label: 'Approved & Live',           color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: '✅' },
  pending:  { label: 'Pending Review',             color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     icon: '⏳' },
  rejected: { label: 'Rejected',                   color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-200',       icon: '❌' },
  modify:   { label: 'Modifications Requested',    color: 'text-violet-700',  bg: 'bg-violet-50 border-violet-200',   icon: '📋' }
};

const APPROVAL_STEPS = [
  { key: 'submitted', label: 'Application Submitted', icon: '📋' },
  { key: 'review',    label: 'Under Admin Review',    icon: '🔍' },
  { key: 'approved',  label: 'Approved & Live',       icon: '🎉' },
];

const INDIA_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export default function MyStorePage() {
  const { shops, updateMyShop, notify } = useApp();
  const myShop = shops[0] || null;

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', phone: '', email: '', openingHours: '',
    street: '', city: '', state: '', zipCode: '',
    lng: '', lat: '',
    deliveryEnabled: false, deliveryRadius: 5, deliveryCharge: 0,
    isOpen: true
  });
  const [loading, setLoading] = useState(false);

  // GPS states for edit form
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null);
  const [gpsMessage, setGpsMessage] = useState('');

  useEffect(() => {
    if (myShop) {
      setForm({
        name: myShop.name || '',
        description: myShop.description || '',
        phone: myShop.phone || '',
        email: myShop.email || '',
        openingHours: myShop.openingHours || '9:00 AM - 7:00 PM',
        street: myShop.address?.street || '',
        city: myShop.address?.city || '',
        state: myShop.address?.state || 'Karnataka',
        zipCode: myShop.address?.zipCode || '',
        lng: String(myShop.location?.coordinates?.[0] || ''),
        lat: String(myShop.location?.coordinates?.[1] || ''),
        deliveryEnabled: myShop.deliverySettings?.isEnabled || false,
        deliveryRadius: myShop.deliverySettings?.radius || 5,
        deliveryCharge: myShop.deliverySettings?.charge || 0,
        isOpen: myShop.isOpen !== false
      });
    }
  }, [myShop]);

  if (!myShop) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>My Store</h1>
          <p className="text-gray-500 text-sm mt-1">You don't have a store yet. Apply below to get started.</p>
        </div>
        <ApplyStorePanel />
      </div>
    );
  }

  const timelineStep = myShop.approvalStatus === 'approved' ? 2 : 1;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFetchGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsMessage('Geolocation is not supported by this browser. Please enter coordinates manually.');
      notify('warning', 'Geolocation not supported. Enter coordinates manually.');
      return;
    }
    setGpsLoading(true);
    setGpsStatus(null);
    setGpsMessage('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm(f => ({ ...f, lat: latitude.toFixed(6), lng: longitude.toFixed(6) }));
        setGpsStatus('success');
        setGpsMessage(`📍 Detected: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setGpsLoading(false);
        notify('success', 'Location detected successfully!');

        // Reverse geocoding to auto-fill address details
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, {
          headers: { 'User-Agent': 'NearBuy-App' }
        })
          .then((res) => res.json())
          .then((data) => {
            if (data && data.address) {
              const addr = data.address;
              
              // Street address: combine road and suburb/neighbourhood
              const streetParts = [];
              if (addr.road) streetParts.push(addr.road);
              if (addr.suburb) streetParts.push(addr.suburb);
              else if (addr.neighbourhood) streetParts.push(addr.neighbourhood);
              const street = streetParts.join(', ') || addr.amenity || addr.shop || '';

              // City: city || town || village || municipality || county
              const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';

              // State: match against INDIA_STATES
              let state = '';
              if (addr.state) {
                const matchedState = INDIA_STATES.find(
                  (s) => s.toLowerCase() === addr.state.toLowerCase()
                );
                if (matchedState) {
                  state = matchedState;
                }
              }

              // PIN Code
              const zipCode = addr.postcode || '';

              setForm((f) => ({
                ...f,
                street: street || f.street,
                city: city || f.city,
                state: state || f.state,
                zipCode: zipCode || f.zipCode
              }));

              setGpsMessage(
                `📍 Detected: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}\n` +
                `🏠 Address: ${street ? street + ', ' : ''}${city ? city + ', ' : ''}${state ? state + ' ' : ''}${zipCode ? '- ' + zipCode : ''}`
              );
            }
          })
          .catch((err) => {
            console.warn('Reverse geocoding failed or offline:', err);
          });
      },
      (error) => {
        let msg = 'Could not fetch your location.';
        if (error.code === 1) msg = 'Location access was denied. Please enable it in browser settings, or enter coordinates manually.';
        else if (error.code === 2) msg = 'Location unavailable. Check your GPS signal.';
        else if (error.code === 3) msg = 'Location request timed out. Try again.';
        setGpsStatus('error');
        setGpsMessage(msg);
        setGpsLoading(false);
        notify('error', msg);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        phone: form.phone,
        email: form.email,
        openingHours: form.openingHours,
        address: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state,
          zipCode: form.zipCode.trim(),
          country: 'India'
        },
        coordinates: [parseFloat(form.lng) || 0, parseFloat(form.lat) || 0],
        deliverySettings: {
          isEnabled: form.deliveryEnabled,
          radius: parseFloat(form.deliveryRadius) || 5,
          charge: parseFloat(form.deliveryCharge) || 0,
          minOrder: 0
        },
        isOpen: form.isOpen
      };

      const res = await updateMyShop(payload);
      if (res.success) {
        setIsEditing(false);
      }
    } catch (err) {
      // error handled in context/notify
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>My Store</h1>
          <p className="text-gray-500 text-sm mt-1">Your registered storefront on NearBuy</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {myShop.approvalStatus === 'approved' && (
            <button
              onClick={async () => {
                setLoading(true);
                try { await updateMyShop({ isOpen: !myShop.isOpen }); }
                catch (err) {}
                finally { setLoading(false); }
              }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-xs transition-all shadow-sm ${
                myShop.isOpen
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${myShop.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              Store: {myShop.isOpen ? 'OPEN' : 'CLOSED'}
            </button>
          )}
          {myShop.approvalStatus !== 'pending' && !isEditing && (
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
              ⚙️ Edit Profile
            </Button>
          )}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm ${STATUS_INFO[myShop.approvalStatus]?.bg} ${STATUS_INFO[myShop.approvalStatus]?.color}`}>
            <span>{STATUS_INFO[myShop.approvalStatus]?.icon}</span>
            {STATUS_INFO[myShop.approvalStatus]?.label}
          </div>
        </div>
      </div>

      {/* Admin Feedback Banners */}
      {myShop.approvalStatus === 'modify' && myShop.modificationFeedback && (
        <div className="flex items-start gap-3 bg-violet-50 border border-violet-200 rounded-2xl p-4 text-sm text-violet-700">
          <span className="text-xl shrink-0">📋</span>
          <div>
            <p className="font-bold mb-1">Feedback from Admin (Modifications Requested)</p>
            <p className="text-violet-600/80 mb-3 text-xs leading-relaxed">{myShop.modificationFeedback}</p>
            {!isEditing && (
              <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
                Modify Store Details
              </Button>
            )}
          </div>
        </div>
      )}

      {myShop.approvalStatus === 'rejected' && myShop.rejectionReason && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
          <span className="text-xl shrink-0">⚠️</span>
          <div>
            <p className="font-semibold mb-0.5">Rejection Reason</p>
            <p className="text-rose-600/80 text-xs leading-relaxed">{myShop.rejectionReason}</p>
          </div>
        </div>
      )}

      {!isEditing ? (
        /* ── VIEW PROFILE MODE ── */
        <div className="space-y-6 animate-fade-in">
          {/* Approval Timeline */}
          {myShop.approvalStatus !== 'modify' && myShop.approvalStatus !== 'rejected' && (
            <div className="card p-6 shadow-sm">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Application Status</h2>
              <div className="flex items-start gap-0">
                {APPROVAL_STEPS.map((step, idx) => {
                  const done = idx < timelineStep;
                  const active = idx === timelineStep;
                  return (
                    <React.Fragment key={step.key}>
                      <div className="flex flex-col items-center gap-2 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                          done   ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-600' :
                          active ? 'bg-violet-50 border-2 border-violet-400 text-violet-600 animate-pulse-ring' :
                                   'bg-gray-50 border-2 border-gray-200 opacity-50 text-gray-400'
                        }`}>
                          {step.icon}
                        </div>
                        <p className={`text-xs text-center leading-tight font-medium ${
                          done ? 'text-emerald-600' : active ? 'text-violet-600' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                      {idx < APPROVAL_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mt-5 ${idx < timelineStep ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Store Details Card */}
          <div className="card p-6 space-y-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Store Details</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-3xl shrink-0">🏪</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{myShop.name}</h3>
                <p className="text-sm text-gray-500">{myShop.category}</p>
              </div>
            </div>
            {myShop.description && <p className="text-sm text-gray-500 leading-relaxed">{myShop.description}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: '📍 Street Address',    value: `${myShop.address?.street}, ${myShop.address?.city}, ${myShop.address?.zipCode}` },
                { label: '🕐 Opening Hours',     value: myShop.openingHours },
                { label: '📞 Store Phone',        value: myShop.phone || 'Not set' },
                { label: '📧 Store Email',        value: myShop.email || 'Not set' },
                { label: '🗺️ GPS Coordinates',   value: myShop.location?.coordinates ? `[Lat: ${myShop.location.coordinates[1]}, Lng: ${myShop.location.coordinates[0]}]` : 'Not set' },
                {
                  label: '🚀 Delivery Settings',
                  value: myShop.deliverySettings?.isEnabled
                    ? `Enabled · Radius: ${myShop.deliverySettings.radius}km · Charge: ₹${myShop.deliverySettings.charge}`
                    : 'Disabled (Pickup Only)'
                }
              ].map((f) => (
                <div key={f.label} className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 mb-1">{f.label}</p>
                  <p className="text-sm text-gray-900 font-medium">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── EDIT PROFILE MODE ── */
        <form onSubmit={handleSave} className="card p-6 space-y-6 animate-scale-in shadow-sm">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Edit Store Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-base">Store Name</label>
              <input name="name" value={form.name} onChange={handleChange} required className="input-base text-xs" />
            </div>
            <div>
              <label className="label-base">Opening Hours</label>
              <input name="openingHours" value={form.openingHours} onChange={handleChange} className="input-base text-xs" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-base">Store Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="input-base text-xs resize-none" />
            </div>
            <div>
              <label className="label-base">Store Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="input-base text-xs" />
            </div>
            <div>
              <label className="label-base">Store Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="input-base text-xs" />
            </div>
          </div>

          {/* Address */}
          <div className="border-t border-gray-100 pt-5 space-y-4">
            <h3 className="text-xs font-bold text-violet-700 uppercase tracking-wider">📍 Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="label-base">Street Address</label>
                <input name="street" value={form.street} onChange={handleChange} className="input-base text-xs" />
              </div>
              <div>
                <label className="label-base">City</label>
                <input name="city" value={form.city} onChange={handleChange} className="input-base text-xs" />
              </div>
              <div>
                <label className="label-base">State</label>
                <select name="state" value={form.state} onChange={handleChange} className="select-base text-xs">
                  {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label-base">PIN Code</label>
                <input name="zipCode" value={form.zipCode} onChange={handleChange} maxLength={6} className="input-base text-xs" />
              </div>
            </div>
          </div>

          {/* GPS Coordinates */}
          <div className="border-t border-gray-100 pt-5 space-y-3">
            <h3 className="text-xs font-bold text-violet-700 uppercase tracking-wider">🗺️ GPS Coordinates *</h3>
            <button
              type="button"
              onClick={handleFetchGPS}
              disabled={gpsLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                gpsLoading ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-wait' :
                gpsStatus === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                gpsStatus === 'error' ? 'bg-rose-50 border-rose-200 text-rose-600' :
                'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100'
              }`}
            >
              {gpsLoading ? '⏳ Detecting…' : gpsStatus === 'success' ? '✅ Location Detected' : '📍 Use Current Location'}
            </button>
            {gpsMessage && (
              <div className={`mb-3 text-xs px-4 py-2.5 rounded-xl border font-medium ${
                gpsStatus === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}>
                {gpsMessage}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-base">Latitude</label>
                <input name="lat" type="number" step="0.000001" value={form.lat} onChange={handleChange} placeholder="e.g. 12.9348" className="input-base text-xs font-mono" />
              </div>
              <div>
                <label className="label-base">Longitude</label>
                <input name="lng" type="number" step="0.000001" value={form.lng} onChange={handleChange} placeholder="e.g. 77.6245" className="input-base text-xs font-mono" />
              </div>
            </div>
          </div>

          {/* Store Status */}
          <div className="border-t border-gray-100 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-violet-700 uppercase tracking-wider">🟢 Store Open / Closed Status</h3>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input name="isOpen" type="checkbox" checked={form.isOpen} onChange={handleChange} className="w-4 h-4 rounded text-violet-600 border-gray-300 focus:ring-0 cursor-pointer" />
                <span className="text-xs font-bold text-gray-700">Open for Orders</span>
              </label>
            </div>
          </div>

          {/* Delivery Settings */}
          <div className="border-t border-gray-100 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-violet-700 uppercase tracking-wider">🚀 Home Delivery Service</h3>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input name="deliveryEnabled" type="checkbox" checked={form.deliveryEnabled} onChange={handleChange} className="w-4 h-4 rounded text-violet-600 border-gray-300 focus:ring-0 cursor-pointer" />
                <span className="text-xs font-bold text-gray-700">Enable Delivery</span>
              </label>
            </div>
            {form.deliveryEnabled && (
              <div className="grid grid-cols-2 gap-4 animate-scale-in">
                <div>
                  <label className="label-base">Service Radius (km)</label>
                  <input name="deliveryRadius" type="number" min="1" value={form.deliveryRadius} onChange={handleChange} className="input-base text-xs" />
                </div>
                <div>
                  <label className="label-base">Delivery Charge (₹)</label>
                  <input name="deliveryCharge" type="number" min="0" value={form.deliveryCharge} onChange={handleChange} className="input-base text-xs" />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={loading} icon="💾">Save Details</Button>
          </div>
        </form>
      )}
    </div>
  );
}
