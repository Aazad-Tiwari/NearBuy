import React, { useState } from 'react';
import Badge from '../common/Badge';
import { useApp } from '../../context/AppContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { buyerAPI } from '../../services/api';

/**
 * PickupTickets — lists active buyer orders with PINs and status in light theme
 */
function formatPickupTime(dt) {
  const d = new Date(dt);
  const now = new Date();
  const diffMs = d - now;
  const diffMins = Math.round(diffMs / 60000);

  if (diffMs < 0) return `Pickup was ${Math.abs(Math.round(diffMs / 60000))} min ago`;
  if (diffMins < 60) return `Pickup in ${diffMins} min`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `Pickup in ~${diffHours}h`;
  return d.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const ORDER_TIMELINE = [
  { status: 'pending', label: 'Order Placed', icon: '📋' },
  { status: 'confirmed', label: 'Confirmed', icon: '✅' },
  { status: 'packed', label: 'Packed', icon: '📦' },
  { status: 'ready', label: 'Ready for Pickup', icon: '🔔' },
  { status: 'completed', label: 'Collected', icon: '🎉' },
];

function getTimelineStep(status) {
  const idx = ORDER_TIMELINE.findIndex((s) => s.status === status);
  return idx === -1 ? 0 : idx;
}

function StarRating({ rating, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          onClick={() => onChange(star)}
          className={`text-2.5xl transition-transform hover:scale-110 duration-150 focus:outline-none ${
            star <= rating ? 'text-amber-400' : 'text-slate-200'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function TicketCard({ order, onRateOrder, onCancelOrder }) {
  const timelineStep = getTimelineStep(order.status);
  const isCompleted = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';
  const formatPrice = (p) => `₹${p.toLocaleString('en-IN')}`;

  return (
    <div
      className={`card flex flex-col gap-4 p-5 border-slate-200/60 bg-white shadow-sm transition-all hover:shadow-md ${isCompleted ? 'bg-slate-50/70 border-slate-200/40' : ''}`}
      id={`ticket-${order._id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono text-slate-400 mb-0.5">#{order._id.slice(-6).toUpperCase()}</p>
          <p className="font-extrabold text-slate-800 text-sm sm:text-base leading-snug">{order.shopId?.name || 'Unknown Store'}</p>
          {order.shopId?.address && (
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              📍 {order.shopId.address.street}, {order.shopId.address.city}
            </p>
          )}
        </div>
        <Badge variant={isCancelled ? 'cancelled' : order.status} />
      </div>

      {/* PIN — highlight if active */}
      {!isCompleted && !isCancelled && (
        <div className="rounded-2xl p-4 bg-slate-50 border border-slate-200 flex flex-col items-center gap-1 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Pickup PIN</p>
          <div className="text-4xl font-extrabold text-blue-600 tracking-wider mt-1">{order.verificationCode}</div>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Show this code at the store counter</p>
        </div>
      )}

      {/* Order items */}
      <div className="space-y-1.5 bg-slate-50/45 p-3 rounded-xl border border-slate-100">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600 truncate max-w-[65%]">
              {item.productName} <span className="text-slate-400">×{item.quantity}</span>
            </span>
            <span className="text-slate-700">{formatPrice(item.priceAtOrder * item.quantity)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-150 font-extrabold">
          <span className="text-slate-800">Total</span>
          <span className="text-emerald-700">{formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      {/* Timeline progress */}
      {!isCancelled && (
        <div className="flex items-center gap-1 py-1">
          {ORDER_TIMELINE.map((step, idx) => (
            <React.Fragment key={step.status}>
              <div className={`flex flex-col items-center gap-1 flex-1 ${idx <= timelineStep ? 'opacity-100' : 'opacity-35'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all border ${
                  idx < timelineStep ? 'bg-emerald-50 border-emerald-500 text-emerald-600' :
                  idx === timelineStep ? 'bg-blue-50 border-blue-500 text-blue-600 animate-pulse' :
                  'bg-slate-50 border-slate-250 text-slate-400'
                }`}>
                  {step.icon}
                </div>
                <span className="text-[9px] font-bold text-slate-500 text-center leading-tight w-12">{step.label}</span>
              </div>
              {idx < ORDER_TIMELINE.length - 1 && (
                <div className={`flex-1 h-0.5 ${idx < timelineStep ? 'bg-emerald-400' : 'bg-slate-200'} mb-4`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Pickup time & call action */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-3.5 border-t border-slate-150">
        <span className="font-medium">🕐 {formatPickupTime(order.pickupTime)}</span>
        {order.shopId?.phone && <span className="font-bold text-slate-700">📞 {order.shopId.phone}</span>}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 mt-2 pt-2 border-t border-slate-100">
        {isCompleted && (
          <button
            onClick={() => onRateOrder(order)}
            className="w-full text-center py-2.5 px-4 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50/50 font-bold text-xs transition-all shadow-sm"
          >
            ⭐ Rate Store & Products
          </button>
        )}
        {!isCompleted && !isCancelled && ['pending', 'confirmed'].includes(order.status) && (
          <button
            onClick={() => onCancelOrder(order)}
            className="w-full text-center py-2.5 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50/50 font-bold text-xs transition-all shadow-sm"
          >
            ❌ Cancel Order
          </button>
        )}
      </div>
    </div>
  );
}

export default function PickupTickets() {
  const { buyerOrders, notify, cancelBuyerOrder } = useApp();
  const activeOrders = buyerOrders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
  const pastOrders = buyerOrders.filter((o) => o.status === 'completed' || o.status === 'cancelled');

  // Rating Modal States
  const [activeOrder, setActiveOrder] = useState(null);
  const [storeRating, setStoreRating] = useState(0);
  const [storeComment, setStoreComment] = useState('');
  const [productRatings, setProductRatings] = useState({}); // { [productId]: { rating: 0, comment: '' } }
  const [submitting, setSubmitting] = useState(false);

  // Cancellation Modal States
  const [cancellingOrder, setCancellingOrder] = useState(null);

  const handleRateClick = (order) => {
    setActiveOrder(order);
    setStoreRating(0);
    setStoreComment('');
    
    // Initialize empty product reviews for each unique product in items
    const prodReviewInit = {};
    order.items.forEach(item => {
      prodReviewInit[item.productId] = { rating: 0, comment: '' };
    });
    setProductRatings(prodReviewInit);
  };

  const handleProductRatingChange = (productId, val) => {
    setProductRatings(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        rating: val
      }
    }));
  };

  const handleProductCommentChange = (productId, val) => {
    setProductRatings(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        comment: val
      }
    }));
  };

  const handleSubmitReviews = async (e) => {
    e.preventDefault();
    if (!activeOrder) return;

    setSubmitting(true);
    let successCount = 0;
    try {
      // 1. Submit Store Review if rating selected
      if (storeRating > 0) {
        await buyerAPI.submitReview(activeOrder._id, {
          rating: storeRating,
          comment: storeComment
        });
        successCount++;
      }

      // 2. Submit Product Reviews if ratings selected
      for (const prodId of Object.keys(productRatings)) {
        const review = productRatings[prodId];
        if (review.rating > 0) {
          await buyerAPI.submitReview(activeOrder._id, {
            rating: review.rating,
            comment: review.comment,
            productId: prodId
          });
          successCount++;
        }
      }

      if (successCount > 0) {
        notify('success', 'Thank you for your feedback! Review submitted.');
      } else {
        notify('info', 'No ratings were filled to submit.');
      }
      setActiveOrder(null);
    } catch (err) {
      console.error('Failed to submit review(s):', err);
      notify('error', err.message || 'Error submitting reviews. Have you already reviewed this?');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Active tickets */}
      <div>
        <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          🎟️ Active Tickets
          {activeOrders.length > 0 && (
            <span className="text-xs bg-blue-50 text-blue-650 border border-blue-100 px-2 py-0.5 rounded-full font-bold">
              {activeOrders.length}
            </span>
          )}
        </h3>

        {activeOrders.length === 0 ? (
          <div className="card p-12 text-center border-slate-200 bg-white shadow-sm max-w-lg mx-auto">
            <p className="text-4xl mb-3">🎫</p>
            <p className="text-slate-800 font-bold text-sm">No active pickups</p>
            <p className="text-slate-400 text-xs mt-1">Book a product from discovery dashboard to generate a pickup PIN.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeOrders.map((order) => (
              <TicketCard key={order._id} order={order} onRateOrder={handleRateClick} onCancelOrder={setCancellingOrder} />
            ))}
          </div>
        )}
      </div>

      {/* Past orders */}
      {pastOrders.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            📜 Past Orders
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pastOrders.map((order) => (
              <TicketCard key={order._id} order={order} onRateOrder={handleRateClick} onCancelOrder={setCancellingOrder} />
            ))}
          </div>
        </div>
      )}

      {/* Rating / Review Submission Modal */}
      {activeOrder && (
        <Modal
          isOpen={!!activeOrder}
          onClose={() => setActiveOrder(null)}
          title="⭐ Share Your Feedback"
          subtitle={`Reviewing your order at "${activeOrder.shopId?.name}"`}
          size="md"
        >
          <form onSubmit={handleSubmitReviews} className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
            {/* Store Review Section */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Store Experience</h4>
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-medium block">Rate store service and pickup flow *</label>
                <StarRating rating={storeRating} onChange={setStoreRating} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-medium block">Store review comment (optional)</label>
                <textarea
                  value={storeComment}
                  onChange={(e) => setStoreComment(e.target.value)}
                  placeholder="Tell us how the store lookup and pickup went..."
                  rows={2}
                  className="input-base text-xs resize-none"
                />
              </div>
            </div>

            {/* Products Review Section */}
            {activeOrder.items.length > 0 && (
              <div className="space-y-4 border-t border-slate-150 pt-5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Rate Purchased Items</h4>
                <div className="space-y-4">
                  {activeOrder.items.map((item) => {
                    const review = productRatings[item.productId] || { rating: 0, comment: '' };
                    return (
                      <div key={item.productId} className="bg-white border border-slate-200/70 p-4 rounded-xl space-y-3 shadow-sm">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs font-extrabold text-slate-800">{item.productName}</p>
                          <span className="text-[10px] text-slate-400 font-mono">Qty: {item.quantity}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Item Rating</label>
                            <StarRating
                              rating={review.rating}
                              onChange={(val) => handleProductRatingChange(item.productId, val)}
                            />
                          </div>
                          <div className="flex-1 w-full">
                            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Item review comment (optional)</label>
                            <input
                              type="text"
                              value={review.comment}
                              onChange={(e) => handleProductCommentChange(item.productId, e.target.value)}
                              placeholder="Review this item..."
                              className="input-base text-xs py-1.5"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-150">
              <Button type="button" variant="secondary" onClick={() => setActiveOrder(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Submit Review
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingOrder && (
        <Modal
          isOpen={!!cancellingOrder}
          onClose={() => setCancellingOrder(null)}
          title="❌ Confirm Cancellation"
          subtitle={`Cancel order #${cancellingOrder._id.slice(-6).toUpperCase()} at "${cancellingOrder.shopId?.name}"?`}
          size="sm"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Are you sure you want to cancel this order? The items will be returned to the store's inventory catalog.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setCancellingOrder(null)} className="flex-1 font-bold">
                No, Keep Order
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  try {
                    await cancelBuyerOrder(cancellingOrder._id);
                  } catch (err) {
                    // handled by context
                  } finally {
                    setCancellingOrder(null);
                  }
                }}
                className="flex-1 font-bold"
              >
                Yes, Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
