import React, { useState } from 'react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';

const STATUS_ACTIONS = {
  pending:    { next: 'confirmed', label: 'Accept Order',        variant: 'success', icon: '✅' },
  confirmed:  { next: 'packed',    label: 'Mark as Packed',      variant: 'warning', icon: '📦' },
  packed:     { next: 'ready',     label: 'Ready for Pickup',    variant: 'info',    icon: '🔔' },
  ready:      { next: 'completed', label: 'Complete Collection', variant: 'primary', icon: '🎉', requiresPin: true },
};

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'packed', 'ready', 'completed', 'cancelled'];

const STATUS_COLORS = {
  all: 'bg-gray-100 text-gray-700 border-gray-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  packed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ready: 'bg-violet-50 text-violet-700 border-violet-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

function formatTime(dt) {
  return new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function formatPrice(p) {
  return `₹${Number(p).toLocaleString('en-IN')}`;
}

function PinConfirmModal({ isOpen, onClose, onConfirm }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (pin.length !== 4) { setError("Enter the 4-digit PIN from buyer's screen."); return; }
    onConfirm(pin);
    setPin('');
    setError('');
  };
  const handleClose = () => { setPin(''); setError(''); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="🔐 Verify Buyer PIN" subtitle="Enter the 4-digit code shown on the buyer's app" size="sm">
      <div className="flex flex-col gap-5">
        <div>
          <label className="label-base">Customer Verification Code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
            placeholder="• • • •"
            className="input-base text-center text-3xl tracking-[0.5em] font-mono font-bold"
            autoFocus
          />
          {error && <p className="text-rose-500 text-xs mt-2">{error}</p>}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleConfirm} className="flex-1">Confirm Pickup ✓</Button>
        </div>
      </div>
    </Modal>
  );
}

function OrderCard({ order, onUpdateStatus }) {
  const action = STATUS_ACTIONS[order.status];
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const handleAction = async (pin) => {
    if (!action) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    onUpdateStatus({ ...order, status: action.next, verificationCode: pin || order.verificationCode });
    setLoading(false);
    setShowPinModal(false);
  };

  const handleButtonClick = () => {
    if (action?.requiresPin) { setShowPinModal(true); return; }
    handleAction();
  };

  return (
    <>
      <div className="card p-5 flex flex-col gap-4 animate-fade-in border-gray-100 hover:border-violet-200 hover:shadow-md transition-all" id={`sk-order-${order._id}`}>
        {/* Order Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">
                #{order._id.slice(-6).toUpperCase()}
              </p>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                order.orderType === 'delivery' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                {order.orderType === 'delivery' ? '🛵 Delivery' : '🏪 Pickup'}
              </span>
            </div>
            <p className="font-bold text-gray-900 text-sm">
              {order.buyerId?.name || 'Customer'}
            </p>
            {order.buyerId?.email && <p className="text-xs text-gray-400 truncate max-w-[180px]">{order.buyerId.email}</p>}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant={order.status} />
            <p className="text-xs text-gray-400">📅 {formatTime(order.createdAt)}</p>
          </div>
        </div>

        {/* Items */}
        <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 space-y-1.5">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="text-gray-700 font-medium truncate max-w-[60%]">
                {item.productName}
                {item.variantName && <span className="text-gray-400 ml-1">({item.variantName})</span>}
                <span className="text-gray-400 ml-1.5 font-normal">×{item.quantity}</span>
              </span>
              <span className="text-gray-600 font-semibold">{formatPrice(item.priceAtOrder * item.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm pt-2.5 border-t border-gray-200 font-semibold">
            <span className="text-gray-500">Total</span>
            <span className="text-emerald-700 font-extrabold">{formatPrice(order.totalAmount)}</span>
          </div>
        </div>

        {/* Pickup / Delivery Info */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>🕐 {order.orderType === 'delivery' ? 'Est. Delivery:' : 'Pickup:'} {formatTime(order.pickupTime)}</span>
          {order.buyerId?.phone && <span>📞 {order.buyerId.phone}</span>}
        </div>

        {/* Note */}
        {order.pickupNote && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700">
            💬 <span className="font-semibold">Note:</span> {order.pickupNote}
          </div>
        )}

        {/* Action Button */}
        {action && (
          <Button
            variant={action.variant}
            onClick={handleButtonClick}
            loading={loading}
            fullWidth
            icon={action.icon}
          >
            {action.label}
          </Button>
        )}

        {(order.status === 'completed' || order.status === 'cancelled') && (
          <div className={`text-center py-2 rounded-xl text-sm font-semibold ${
            order.status === 'completed'
              ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
              : 'text-rose-600 bg-rose-50 border border-rose-100'
          }`}>
            {order.status === 'completed' ? '✅ Successfully collected by customer' : '❌ Order cancelled by customer'}
          </div>
        )}
      </div>

      <PinConfirmModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onConfirm={(pin) => handleAction(pin)}
      />
    </>
  );
}

export default function OrdersPanel() {
  const { shopkeeperOrders, updateShopkeeperOrder } = useApp();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? shopkeeperOrders
    : shopkeeperOrders.filter((o) => o.status === filter);

  const counts = STATUS_FILTERS.reduce((acc, s) => {
    acc[s] = s === 'all' ? shopkeeperOrders.length : shopkeeperOrders.filter((o) => o.status === s).length;
    return acc;
  }, {});

  const pendingCount = counts['pending'] || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Incoming Orders
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">Review, accept, and process customer pickup & delivery orders.</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold animate-pulse-glow">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {pendingCount} order{pendingCount !== 1 ? 's' : ''} need{pendingCount === 1 ? 's' : ''} attention
          </div>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
              filter === s
                ? STATUS_COLORS[s]
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {counts[s] > 0 && <span className="ml-1.5 opacity-70">({counts[s]})</span>}
          </button>
        ))}
      </div>

      {/* Order Cards */}
      {filtered.length === 0 ? (
        <div className="card p-14 text-center bg-gray-50">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-700 font-semibold">No {filter !== 'all' ? filter : ''} orders</p>
          <p className="text-gray-400 text-sm mt-1">
            {filter === 'all' ? 'Orders will appear here once customers make bookings.' : `No orders with status "${filter}" yet.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((order) => (
            <OrderCard key={order._id} order={order} onUpdateStatus={updateShopkeeperOrder} />
          ))}
        </div>
      )}
    </div>
  );
}
