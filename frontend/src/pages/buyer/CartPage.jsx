import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useApp } from '../../context/AppContext';
import { buyerAPI } from '../../services/api';
import Button from '../../components/common/Button';

const PICKUP_SLOTS = [
  { label: 'In 1 hour', offsetHours: 1 },
  { label: 'In 2 hours', offsetHours: 2 },
  { label: 'In 4 hours', offsetHours: 4 },
  { label: 'Tomorrow morning (10:00 AM)', offsetHours: 22 },
  { label: 'Tomorrow afternoon (2:00 PM)', offsetHours: 26 },
  { label: 'Tomorrow evening (6:00 PM)', offsetHours: 30 },
];

function getSlotTime(offsetHours) {
  return new Date(Date.now() + offsetHours * 60 * 60 * 1000);
}

function formatSlotTime(offsetHours) {
  const d = getSlotTime(offsetHours);
  return d.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function CartPage() {
  const { cartItems, shop, totalAmount, updateQuantity, removeFromCart, clearCart } = useCart();
  const { userLocation, notify, refreshAdminStats } = useApp();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState('pickup'); // 'pickup' | 'delivery'
  const [selectedSlotIdx, setSelectedSlotIdx] = useState(0);
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customTime, setCustomTime] = useState('');
  
  // Delivery details
  const [street, setStreet] = useState('');
  const [city, setCity] = useState(userLocation.name.split(',')[0] || '');
  const [state, setState] = useState('Karnataka');
  const [zipCode, setZipCode] = useState('');
  
  // Coupon details
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  // Payment details
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'cod'
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' | 'checkout' | 'payment' | 'success'
  const [placedOrder, setPlacedOrder] = useState(null);
  
  // Simulation states
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPrice = (p) => `₹${p.toLocaleString('en-IN')}`;

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'WELCOME10') {
      setDiscountAmount(totalAmount * 0.1);
      setCouponApplied(true);
      notify('success', 'Promo code WELCOME10 applied! 10% discount.');
    } else {
      notify('error', 'Invalid promo code. Try WELCOME10.');
    }
  };

  const deliveryCharge = orderType === 'delivery' && shop?.deliverySettings?.isEnabled ? (shop.deliverySettings.charge || 0) : 0;
  const finalTotal = totalAmount - discountAmount + deliveryCharge;

  const handleCheckoutSubmit = async (simulateSuccess = true) => {
    setLoading(true);
    try {
      const pickupDate = useCustomTime
        ? new Date(customTime)
        : getSlotTime(PICKUP_SLOTS[selectedSlotIdx].offsetHours);

      const payload = {
        shopId: shop._id,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          variantName: item.variantName
        })),
        pickupTime: pickupDate,
        pickupNote: orderType === 'delivery' ? `Deliver to: ${street}, ${city}, ${zipCode}` : 'Standard Pickup',
        deliveryAddress: orderType === 'delivery' ? { street, city, state, zipCode } : undefined,
        paymentMethod,
        coordinates: [userLocation.lng, userLocation.lat], // pass simulation user coordinates
        couponCode: couponApplied ? couponCode : undefined
      };

      if (paymentMethod === 'online' && !simulateSuccess) {
        throw new Error('Simulated online card payment failed. Please check balance.');
      }

      const res = await buyerAPI.placeOrder(payload);
      if (res.success && res.order) {
        setPlacedOrder(res.order);
        clearCart();
        setCheckoutStep('success');
        notify('success', 'Order created successfully!');
      } else {
        throw new Error(res.message || 'Failed to place order.');
      }
    } catch (err) {
      notify('error', err.message || 'Checkout failed.');
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && checkoutStep !== 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-6 animate-fade-in">
        <p className="text-6xl filter drop-shadow-md">🛒</p>
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Your Cart is Empty</h2>
          <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
            Browse nearby stores to add physical items and book pickups or express home deliveries today.
          </p>
        </div>
        <Link to="/buyer">
          <Button variant="primary" icon="🛍️">Explore Marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Checkout Progress bar */}
      <div className="flex items-center justify-center gap-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 bg-white border border-gray-150 px-5 py-3.5 rounded-2xl shadow-sm max-w-2xl mx-auto">
        <span className={checkoutStep === 'cart' ? 'text-blue-600 font-extrabold' : 'text-gray-500'}>1. Cart</span>
        <span className="text-gray-300 font-light">→</span>
        <span className={checkoutStep === 'checkout' ? 'text-blue-600 font-extrabold' : 'text-gray-500'}>2. Slot & Address</span>
        <span className="text-gray-300 font-light">→</span>
        <span className={checkoutStep === 'payment' ? 'text-blue-600 font-extrabold' : 'text-gray-500'}>3. Payment</span>
        <span className="text-gray-300 font-light">→</span>
        <span className={checkoutStep === 'success' ? 'text-emerald-605 font-extrabold' : 'text-gray-500'}>4. Order Confirmed!</span>
      </div>

      {checkoutStep === 'cart' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900">Shopping Cart</h2>
              <span className="text-xs text-gray-600 font-bold bg-gray-50 border border-gray-200 px-3 py-1 rounded-full uppercase">
                🏪 {shop?.name}
              </span>
            </div>

            <div className="card divide-y divide-gray-150 overflow-hidden bg-white shadow-sm border border-gray-200 rounded-2xl">
              {cartItems.map((item) => (
                <div key={item.productId + item.variantName} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all hover:bg-slate-50/40">
                  {/* Left Side: Product Image & Details */}
                  <div className="flex gap-4 items-start md:items-center flex-1 min-w-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-20 h-20 rounded-2xl object-cover border border-slate-200/80 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl shrink-0">
                        📦
                      </div>
                    )}
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-slate-800 font-extrabold text-base leading-snug truncate">
                        {item.productName}
                      </h3>
                      <div className="flex flex-wrap gap-2 items-center">
                        {item.variantName && (
                          <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-150 px-2.5 py-0.5 rounded-full font-bold">
                            {item.variantName}
                          </span>
                        )}
                        {item.stock <= 5 ? (
                          <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-150 px-2.5 py-0.5 rounded-full font-bold">
                            ⚠️ Only {item.stock} left
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-150 px-2.5 py-0.5 rounded-full font-bold">
                            ✓ In Stock
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium">
                        Unit Price: <span className="text-slate-650 font-bold">{formatPrice(item.price)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Quantity selector, Subtotal & Actions */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                    {/* Quantity Picker */}
                    <div className="flex flex-col gap-1 items-start md:items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quantity</span>
                      <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/50">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantName, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center font-black transition-all"
                        >
                          −
                        </button>
                        <span className="text-slate-800 font-bold text-sm w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantName, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center font-black transition-all disabled:opacity-40 disabled:hover:bg-white"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="text-left md:text-right min-w-[90px]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</span>
                      <p className="text-base font-black text-emerald-650 tracking-tight mt-1">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>

                    {/* Remove Action */}
                    <button
                      onClick={() => removeFromCart(item.productId, item.variantName)}
                      className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-450 hover:text-rose-600 border border-slate-200 hover:border-rose-150 flex items-center justify-center transition-all duration-200"
                      title="Remove item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Link to="/buyer" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1">
                ← Add more products
              </Link>
              <button onClick={clearCart} className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline">
                Clear all cart
              </button>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900">Bill Summary</h2>
            <div className="card p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Price</span>
                  <span className="text-gray-700 font-bold">{formatPrice(totalAmount)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-blue-650 font-semibold">
                    <span>Discount</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-gray-150/80 pt-3">
                  <span className="text-gray-600 font-semibold">Subtotal</span>
                  <span className="text-gray-900 font-black text-base">{formatPrice(totalAmount - discountAmount)}</span>
                </div>
              </div>

              {/* Promo input */}
              <div className="space-y-2 pt-2 border-t border-gray-150/80">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block">Have a promo code?</label>
                <div className="flex gap-2">
                  <input
                    placeholder="e.g. WELCOME10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={couponApplied}
                    className="input-base text-xs py-2 uppercase"
                  />
                  <Button variant="secondary" onClick={applyCoupon} disabled={couponApplied} className="py-2 text-xs">
                    Apply
                  </Button>
                </div>
                {couponApplied && <p className="text-[10px] text-emerald-650 font-bold">✓ Coupon applied! WELCOME10 active.</p>}
              </div>

              <Button variant="primary" onClick={() => setCheckoutStep('checkout')} className="w-full mt-2" icon="💳">
                Proceed to Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {checkoutStep === 'checkout' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-black text-gray-900">Delivery & Timing Settings</h2>

            {/* Toggle Order Type */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setOrderType('pickup');
                  setPaymentMethod('online');
                }}
                className={`card p-5 border text-left transition-all relative overflow-hidden ${
                  orderType === 'pickup'
                    ? 'border-blue-500 bg-blue-50/20 text-blue-700 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-3xl block mb-2">🏬</span>
                <p className="font-bold text-gray-800 text-sm">Self Pickup</p>
                <p className="text-xs text-gray-500 mt-1">Book items now, pick up yourself from store counter using 4-digit PIN.</p>
                {orderType === 'pickup' && <span className="absolute top-3 right-3 text-blue-600 text-xs font-bold">✓</span>}
              </button>

              <button
                onClick={() => {
                  if (shop?.deliverySettings?.isEnabled) {
                    setOrderType('delivery');
                  } else {
                    notify('error', 'This store only supports self-pickup.');
                  }
                }}
                disabled={!shop?.deliverySettings?.isEnabled}
                className={`card p-5 border text-left transition-all relative overflow-hidden ${
                  !shop?.deliverySettings?.isEnabled ? 'opacity-40 cursor-not-allowed' : ''
                } ${
                  orderType === 'delivery'
                    ? 'border-blue-500 bg-blue-50/20 text-blue-700 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-3xl block mb-2">🚀</span>
                <p className="font-bold text-gray-800 text-sm">Express Home Delivery</p>
                <p className="text-xs text-gray-500 mt-1">
                  {shop?.deliverySettings?.isEnabled
                    ? `Get delivered directly. Radius: ${shop.deliverySettings.radius || 5}km, Charge: ₹${shop.deliverySettings.charge || 0}`
                    : 'Store does not support delivery.'}
                </p>
                {orderType === 'delivery' && <span className="absolute top-3 right-3 text-blue-600 text-xs font-bold">✓</span>}
              </button>
            </div>

            {orderType === 'pickup' ? (
              /* ── Pickup Slot Form ── */
              <div className="card p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm mb-1">Select Pickup Timing Slot</h3>
                  <p className="text-xs text-gray-500">Pick a convenient hour to pick up your packed items.</p>
                </div>

                {!useCustomTime ? (
                  <div className="grid grid-cols-2 gap-3">
                    {PICKUP_SLOTS.map((slot, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSlotIdx(idx)}
                        className={`text-left px-4 py-3 rounded-2xl text-xs border transition-all duration-150 ${
                          selectedSlotIdx === idx
                            ? 'bg-blue-50 border-blue-400 text-blue-750 font-bold'
                            : 'bg-gray-50/50 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                      >
                        <div className="font-semibold text-sm">{slot.label}</div>
                        <div className="text-[10px] opacity-70 mt-1 font-mono">{formatSlotTime(slot.offsetHours)}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="datetime-local"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    min={new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16)}
                    className="input-base text-xs max-w-sm"
                  />
                )}

                <button
                  onClick={() => setUseCustomTime((v) => !v)}
                  className="text-xs text-blue-600 hover:underline block font-semibold"
                >
                  {useCustomTime ? '← Use predefined timings' : 'Enter custom date/time →'}
                </button>
              </div>
            ) : (
              /* ── Delivery Address Form ── */
              <div className="card p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm mb-1">Enter Delivery Address</h3>
                  <p className="text-xs text-gray-500">Providing deliveries within a {shop.deliverySettings.radius || 5}km store radius.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label-base text-xs">Street Address *</label>
                    <input
                      placeholder="e.g. Room 42, Green Heights Apartments, MG Road"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="input-base text-xs"
                    />
                  </div>
                  <div>
                    <label className="label-base text-xs">City *</label>
                    <input
                      placeholder="Bangalore"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="input-base text-xs"
                    />
                  </div>
                  <div>
                    <label className="label-base text-xs">PIN Code *</label>
                    <input
                      placeholder="560001"
                      maxLength={6}
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="input-base text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Toggle Payment Method */}
            <div className="card p-6 space-y-4">
              <div>
                <h3 className="font-bold text-gray-800 text-sm mb-1">Payment Method</h3>
                <p className="text-xs text-gray-500">Simulate secure payments online or choose Cash on Delivery.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setPaymentMethod('online')}
                  className={`flex-1 p-4 rounded-xl border text-left transition-all ${
                    paymentMethod === 'online'
                      ? 'border-blue-500 bg-blue-50/20 text-blue-750 font-bold shadow-sm'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <p className="font-bold text-sm">💳 Online Simulated Card</p>
                  <p className="text-[10px] opacity-70 mt-1">Pay instantly online to receive your confirmation code.</p>
                </button>

                <button
                  onClick={() => {
                    if (orderType === 'delivery') {
                      setPaymentMethod('cod');
                    }
                  }}
                  disabled={orderType === 'pickup'}
                  className={`flex-1 p-4 rounded-xl border text-left transition-all ${
                    orderType === 'pickup' ? 'opacity-40 cursor-not-allowed' : ''
                  } ${
                    paymentMethod === 'cod'
                      ? 'border-blue-500 bg-blue-50/20 text-blue-750 font-bold shadow-sm'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <p className="font-bold text-sm">💵 Cash on Delivery (COD)</p>
                  <p className="text-[10px] opacity-70 mt-1">Pay at the store counter or to the delivery partner on arrival.</p>
                </button>
              </div>

              {orderType === 'pickup' && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 font-semibold mt-3 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Upfront online payment is required for Self Pickup orders to guarantee store preparation.</span>
                </div>
              )}
            </div>
          </div>

          {/* Checkout Summary info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900">Checkout</h2>
            <div className="card p-6 space-y-4">
              <div className="space-y-2 border-b border-gray-150 pb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Shop details</p>
                <p className="text-sm font-bold text-gray-800">{shop?.name}</p>
                <p className="text-xs text-gray-500">{shop?.address?.street}, {shop?.address?.city}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Calculated Charges</p>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Items Subtotal</span>
                  <span>{formatPrice(totalAmount - discountAmount)}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Delivery Charge</span>
                    <span>{formatPrice(deliveryCharge)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-150 pt-3">
                  <span>Grand Total</span>
                  <span className="text-emerald-600 font-extrabold">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button variant="secondary" onClick={() => setCheckoutStep('cart')} className="flex-1">
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (orderType === 'delivery' && (!street.trim() || !zipCode.trim())) {
                      notify('error', 'Please complete the delivery address fields.');
                      return;
                    }
                    if (useCustomTime && !customTime) {
                      notify('error', 'Please choose a custom delivery/pickup timing.');
                      return;
                    }
                    if (paymentMethod === 'online') {
                      setCheckoutStep('payment');
                    } else {
                      handleCheckoutSubmit(true);
                    }
                  }}
                  className="flex-1"
                >
                  {paymentMethod === 'online' ? 'Go to Payment' : 'Place Order'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {checkoutStep === 'payment' && (
        <div className="max-w-md mx-auto card p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-black text-gray-900">Simulate Payment</h2>
            <p className="text-xs text-gray-500 mt-1">Simulate successful or failed online payment checkout.</p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white font-mono shadow-2xl relative overflow-hidden select-none">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider">Simulated PayCard</span>
              <span className="text-lg">💳</span>
            </div>
            <div className="text-sm mb-4 tracking-widest">
              {cardNumber || '•••• •••• •••• ••••'}
            </div>
            <div className="flex justify-between text-[10px] uppercase">
              <div>
                <p className="opacity-60 text-[8px]">Cardholder</p>
                <p className="font-bold">{cardHolder.toUpperCase() || 'YOUR NAME'}</p>
              </div>
              <div className="text-right">
                <p className="opacity-60 text-[8px]">Expires</p>
                <p className="font-bold">{cardExpiry || 'MM/YY'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label-base text-xs">Cardholder Name</label>
              <input
                placeholder="John Doe"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                className="input-base text-xs"
              />
            </div>
            <div>
              <label className="label-base text-xs">Card Number</label>
              <input
                placeholder="4111 2222 3333 4444"
                maxLength={19}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                className="input-base text-xs font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-base text-xs">Expiry Date</label>
                <input
                  placeholder="12/28"
                  maxLength={5}
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="input-base text-xs font-mono"
                />
              </div>
              <div>
                <label className="label-base text-xs">CVV</label>
                <input
                  placeholder="123"
                  type="password"
                  maxLength={3}
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  className="input-base text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-150">
            <Button
              variant="secondary"
              onClick={() => setCheckoutStep('checkout')}
              disabled={loading}
              className="flex-1"
            >
              Back
            </Button>
            <button
              onClick={() => handleCheckoutSubmit(false)}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold transition-all text-xs"
            >
              Simulate Fail
            </button>
            <Button
              variant="primary"
              onClick={() => handleCheckoutSubmit(true)}
              loading={loading}
              className="flex-1 text-xs"
            >
              Simulate Success
            </Button>
          </div>
        </div>
      )}

      {checkoutStep === 'success' && placedOrder && (
        <div className="max-w-md mx-auto text-center space-y-6 py-10 animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-4xl mx-auto animate-pulse text-emerald-600">🎉</div>
          
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Order Confirmed!</h2>
            <p className="text-gray-500 text-sm mt-1">Your order booking is successfully placed at the store.</p>
          </div>

          <div className="card p-6 bg-gray-50/50 border-gray-150 space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Show this verification PIN at collection</p>
              <div className="text-5xl font-black text-amber-600 tracking-widest select-all font-mono py-4 bg-amber-50 rounded-2xl border border-amber-200 shadow-sm">
                {placedOrder.verificationCode}
              </div>
            </div>

            <div className="text-left divide-y divide-gray-150 text-xs space-y-2.5 pt-2">
              <div className="flex justify-between pt-2.5">
                <span className="text-gray-500">Order ID</span>
                <span className="text-gray-700 font-semibold truncate max-w-[150px] font-mono">{placedOrder._id}</span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-gray-500">Total Price</span>
                <span className="text-emerald-600 font-bold">{formatPrice(placedOrder.totalAmount)}</span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-gray-500">Fulfillment Mode</span>
                <span className="text-gray-800 capitalize font-semibold">{placedOrder.orderType}</span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-gray-500">Estimated Slot</span>
                <span className="text-gray-800 font-medium">{new Date(placedOrder.pickupTime).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link to="/buyer/tickets">
              <Button variant="primary" className="w-full">Track Orders & Show PIN</Button>
            </Link>
            <Link to="/buyer">
              <Button variant="secondary" className="w-full">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
