import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useApp } from '../../context/AppContext';

/**
 * BookingModal — allows buyer to select pickup time and confirm booking in light theme
 */
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

export default function BookingModal({ isOpen, onClose, product }) {
  const { addBuyerOrder } = useApp();
  const [selectedSlotIdx, setSelectedSlotIdx] = useState(0);
  const [customTime, setCustomTime] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  if (!product) return null;

  const maxQty = Math.min(product.stock || 1, 10);
  const unitPrice = product.price;
  const totalPrice = unitPrice * quantity;
  const formatPrice = (p) => `₹${p.toLocaleString('en-IN')}`;

  const isShopClosed = product.shopId?.isOpen === false;

  const handleConfirm = async () => {
    if (isShopClosed) return;
    setLoading(true);
    try {
      const pickupDate = useCustom
        ? new Date(customTime)
        : getSlotTime(PICKUP_SLOTS[selectedSlotIdx].offsetHours);

      const shopIdVal = product.shopId._id || product.shopId;

      const order = await addBuyerOrder({
        shopId: shopIdVal,
        items: [{ productId: product._id, quantity }],
        pickupTime: pickupDate,
        pickupNote: note,
      });

      setPlacedOrder(order);
      setConfirmed(true);
    } catch (err) {
      console.error('Failed to book pickup:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmed(false);
    setPlacedOrder(null);
    setQuantity(1);
    setNote('');
    setSelectedSlotIdx(0);
    setUseCustom(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={confirmed ? '🎉 Booking Confirmed!' : '📦 Book for Pickup'}
      subtitle={confirmed ? 'Show this PIN at the store counter' : `${product.name}`}
      size="md"
    >
      {confirmed && placedOrder ? (
        /* ── Confirmation Screen ─────────────────────────────────────── */
        <div className="flex flex-col items-center gap-6 text-center py-2">
          {/* PIN display */}
          <div className="w-full">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Your Verification PIN</p>
            <div className="rounded-2xl p-6 bg-slate-50 border border-slate-200/60 shadow-sm flex flex-col items-center justify-center">
              <div className="text-5xl font-extrabold text-blue-600 tracking-wider">{placedOrder.verificationCode}</div>
              <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">
                Show this 4-digit PIN to the shopkeeper when you collect your items.
                <br />Keep it safe — do not share it.
              </p>
            </div>
          </div>

          {/* Order summary */}
          <div className="w-full bg-slate-50 border border-slate-200/50 rounded-xl p-4 text-left space-y-2.5">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-slate-500 font-medium">Item</span>
              <span className="text-slate-800 font-extrabold text-right max-w-[60%] truncate">{product.name}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-slate-500 font-medium">Quantity</span>
              <span className="text-slate-800 font-bold">{quantity}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-slate-500 font-medium">Total</span>
              <span className="text-emerald-700 font-extrabold">{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-slate-500 font-medium">Store</span>
              <span className="text-slate-800 font-bold">{product.shopId?.name || '—'}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-slate-500 font-medium">Status</span>
              <span className="text-amber-600 font-extrabold bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded text-[10px]">Pending Approval</span>
            </div>
          </div>

          <Button variant="secondary" onClick={handleClose} fullWidth>
            View My Tickets
          </Button>
        </div>
      ) : (
        /* ── Booking Form ────────────────────────────────────────────── */
        <div className="flex flex-col gap-5">
          {/* Shop closed warning */}
          {isShopClosed && (
            <div className="bg-rose-50 border border-rose-150 rounded-2xl p-4 text-xs text-rose-700 font-bold flex items-start gap-2.5 shadow-sm">
              <span className="text-base leading-none">⚠️</span>
              <div>
                <p className="font-extrabold">Store is Currently Closed</p>
                <p className="text-[10px] text-rose-500/90 font-medium mt-0.5 leading-relaxed">
                  This shopkeeper has closed the store. You cannot place pickup or delivery orders until they reopen.
                </p>
              </div>
            </div>
          )}

          {/* Product summary */}
          <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-200/60 rounded-xl p-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl shrink-0 shadow-sm">📦</div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-slate-800 truncate">{product.name}</p>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{product.shopId?.name} · {product.shopId?.address?.city}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-base font-black text-slate-800">{formatPrice(unitPrice)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">per unit</p>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="label-base text-xs font-bold text-slate-500 mb-1.5 block">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={isShopClosed}
                className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-colors text-lg font-bold flex items-center justify-center shadow-sm"
              >
                −
              </button>
              <span className="text-base font-extrabold text-slate-800 w-10 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={isShopClosed}
                className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-colors text-lg font-bold flex items-center justify-center shadow-sm"
              >
                +
              </button>
              <span className="text-xs text-slate-400 ml-2 font-medium">Max: {maxQty}</span>
              <div className="ml-auto text-right">
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Total Amount</p>
                <p className="text-xl font-black text-emerald-700 leading-none mt-0.5">{formatPrice(totalPrice)}</p>
              </div>
            </div>
          </div>

          {/* Pickup Time */}
          <div>
            <label className="label-base text-xs font-bold text-slate-500 mb-1.5 block">Select Pickup Time</label>
            {!useCustom ? (
              <div className="grid grid-cols-2 gap-2">
                {PICKUP_SLOTS.map((slot, idx) => (
                  <button
                    type="button"
                    key={idx}
                    disabled={isShopClosed}
                    onClick={() => setSelectedSlotIdx(idx)}
                    className={`text-left px-3.5 py-2.5 rounded-xl border transition-all duration-150 shadow-sm ${
                      selectedSlotIdx === idx
                        ? 'bg-blue-50/60 border-blue-400 text-blue-700 font-extrabold'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 disabled:opacity-50'
                    }`}
                  >
                    <div className="text-xs font-extrabold">{slot.label}</div>
                    <div className="text-[10px] opacity-75 mt-0.5 font-medium">{formatSlotTime(slot.offsetHours)}</div>
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="datetime-local"
                disabled={isShopClosed}
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                min={new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16)}
                className="input-base text-xs"
              />
            )}
            <button
              type="button"
              disabled={isShopClosed}
              onClick={() => setUseCustom((v) => !v)}
              className="mt-2.5 text-xs text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors font-bold block"
            >
              {useCustom ? '← Use suggested slots' : 'Choose a custom time →'}
            </button>
          </div>

          {/* Note */}
          <div>
            <label className="label-base text-xs font-bold text-slate-500 mb-1.5 block">Pickup Note (optional)</label>
            <textarea
              disabled={isShopClosed}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. I'll arrive from the back entrance, please keep at counter…"
              rows={2}
              className="input-base resize-none text-xs"
            />
          </div>

          {/* CTA */}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={handleClose} className="flex-1 font-bold">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              loading={loading}
              disabled={isShopClosed || (useCustom && !customTime)}
              className="flex-1 font-bold"
            >
              {isShopClosed ? 'Store Closed' : 'Confirm Booking'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
