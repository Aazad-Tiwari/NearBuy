import React, { useState } from 'react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';

/**
 * ApprovalTable — admin shop registration review interface
 */
const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected', 'modify'];

const CATEGORY_ICONS = {
  Electronics: '💻', Clothing: '👗', Grocery: '🥬', Pharmacy: '💊',
  Books: '📚', Sports: '⚽', 'Home & Garden': '🏡', Toys: '🧸',
  'Food & Beverages': '🍽️', Beauty: '💄', Other: '🏪',
};

function formatDate(dt) {
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function RejectModal({ shop, isOpen, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const REJECTION_REASONS = [
    'Incomplete documentation',
    'Invalid GST/business registration',
    'Address verification failed',
    'Category mismatch',
    'Duplicate store registration',
    'Other (specify below)',
  ];

  const handleConfirm = () => {
    onConfirm(shop._id, reason || 'Application rejected by admin.');
    setReason('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="❌ Reject Application" subtitle={shop?.name} size="sm">
      <div className="flex flex-col gap-4">
        <div>
          <label className="label-base text-slate-500 text-xs font-bold mb-1.5 block">Rejection Reason</label>
          <div className="space-y-2">
            {REJECTION_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r === 'Other (specify below)' ? '' : r)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm border transition-all font-semibold ${
                  reason === r
                    ? 'bg-rose-50 border-rose-200 text-rose-800 shadow-sm'
                    : 'border-slate-200 text-slate-500 hover:border-slate-350 hover:text-slate-800 bg-slate-50/50'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add a custom rejection reason…"
            rows={2}
            className="input-base resize-none mt-2 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1 font-bold">Cancel</Button>
          <Button variant="danger" onClick={handleConfirm} className="flex-1 font-bold">Confirm Rejection</Button>
        </div>
      </div>
    </Modal>
  );
}

function ModifyModal({ shop, isOpen, onClose, onConfirm }) {
  const [feedback, setFeedback] = useState('');
  const FEEDBACK_OPTIONS = [
    'Please correct store timings',
    'GST number is missing or blurry',
    'Invalid coordinates / location mismatch',
    'Description is too short or generic',
    'Category should be changed',
    'Other (specify below)',
  ];

  const handleConfirm = () => {
    onConfirm(shop._id, feedback || 'Modifications requested by admin.');
    setFeedback('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚠️ Request Modifications" subtitle={shop?.name} size="sm">
      <div className="flex flex-col gap-4">
        <div>
          <label className="label-base text-slate-500 text-xs font-bold mb-1.5 block">What needs to be updated?</label>
          <div className="space-y-2">
            {FEEDBACK_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => setFeedback(f === 'Other (specify below)' ? '' : f)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm border transition-all font-semibold ${
                  feedback === f
                    ? 'bg-amber-50 border-amber-200 text-amber-850 shadow-sm'
                    : 'border-slate-200 text-slate-500 hover:border-slate-350 hover:text-slate-800 bg-slate-50/50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Add custom instructions for the shopkeeper…"
            rows={2}
            className="input-base resize-none mt-2 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1 font-bold">Cancel</Button>
          <Button variant="warning" onClick={handleConfirm} className="flex-1 font-bold">Send Request</Button>
        </div>
      </div>
    </Modal>
  );
}

function ModifyModalButton({ shop, onModify, loading }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="warning"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={!!loading}
        className="font-bold text-xs"
      >
        Modify
      </Button>
      <ModifyModal
        shop={shop}
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={(_, reason) => { onModify(reason); setOpen(false); }}
      />
    </>
  );
}

function ShopRow({ shop, onApprove, onReject, onModify }) {
  const [loading, setLoading] = useState(null);
  const icon = CATEGORY_ICONS[shop.category] || '🏪';

  const handleApprove = async () => {
    setLoading('approve');
    await new Promise((r) => setTimeout(r, 600));
    onApprove(shop._id);
    setLoading(null);
  };

  const handleReject = async (reason) => {
    setLoading('reject');
    await new Promise((r) => setTimeout(r, 400));
    onReject(shop._id, reason);
    setLoading(null);
  };

  const handleModify = async (reason) => {
    setLoading('modify');
    await new Promise((r) => setTimeout(r, 400));
    onModify(shop._id, reason);
    setLoading(null);
  };

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
      {/* Store */}
      <td className="py-4 px-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-205 flex items-center justify-center text-xl shrink-0 shadow-sm">
            {icon}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">{shop.name}</p>
            {shop.description && (
              <p className="text-xs text-slate-400 font-semibold line-clamp-1 mt-0.5 max-w-xs">{shop.description}</p>
            )}
          </div>
        </div>
      </td>

      {/* Owner */}
      <td className="py-4 px-5">
        <p className="text-sm font-bold text-slate-700">{shop.ownerId?.name || '—'}</p>
        <p className="text-xs text-slate-400 font-semibold">{shop.ownerId?.email || '—'}</p>
      </td>

      {/* Category */}
      <td className="py-4 px-5">
        <span className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
          {shop.category}
        </span>
      </td>

      {/* Location */}
      <td className="py-4 px-5">
        <p className="text-sm font-bold text-slate-700">{shop.address?.city}</p>
        <p className="text-xs text-slate-400 font-semibold">{shop.address?.state} {shop.address?.zipCode}</p>
      </td>

      {/* Applied */}
      <td className="py-4 px-5 text-xs text-slate-400 font-bold">
        {formatDate(shop.createdAt)}
      </td>

      {/* Status */}
      <td className="py-4 px-5">
        <div className="flex flex-col gap-1">
          <Badge variant={shop.approvalStatus} />
          {shop.approvalStatus === 'rejected' && shop.rejectionReason && (
            <p className="text-[10px] text-rose-600 font-semibold max-w-[120px] leading-tight mt-0.5">{shop.rejectionReason}</p>
          )}
          {shop.approvalStatus === 'modify' && shop.modificationFeedback && (
            <p className="text-[10px] text-amber-600 font-semibold max-w-[120px] leading-tight mt-0.5">{shop.modificationFeedback}</p>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="py-4 px-5">
        {shop.approvalStatus === 'pending' ? (
          <div className="flex items-center gap-2">
            <Button
              variant="success"
              size="sm"
              onClick={handleApprove}
              loading={loading === 'approve'}
              disabled={!!loading}
              className="font-bold text-xs"
            >
              Approve
            </Button>
            <ModifyModalButton shop={shop} onModify={handleModify} loading={loading} />
            <RejectModalButton shop={shop} onReject={handleReject} loading={loading} />
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-bold">Processed</span>
        )}
      </td>
    </tr>
  );
}

// Separate trigger so each row has its own modal state
function RejectModalButton({ shop, onReject, loading }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="danger"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={!!loading}
        className="font-bold text-xs"
      >
        Reject
      </Button>
      <RejectModal
        shop={shop}
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={(_, reason) => { onReject(reason); setOpen(false); }}
      />
    </>
  );
}

export default function ApprovalTable() {
  const { shops, updateShopStatus } = useApp();
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');

  const filteredShops = shops.filter((s) => {
    const matchesFilter = filter === 'all' || s.approvalStatus === filter;
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.address?.city?.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerId?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = STATUS_FILTERS.reduce((acc, s) => {
    acc[s] = s === 'all' ? shops.length : shops.filter((sh) => sh.approvalStatus === s).length;
    return acc;
  }, {});

  const handleApprove = (shopId) => updateShopStatus(shopId, 'approved');
  const handleReject = (shopId, reason) => updateShopStatus(shopId, 'rejected', reason);
  const handleModify = (shopId, reason) => updateShopStatus(shopId, 'modify', reason);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                filter === s
                  ? 'bg-amber-50 text-amber-705 border-amber-200 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-350 hover:text-slate-800'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {counts[s] > 0 && <span className="ml-1.5 opacity-70 font-black">({counts[s]})</span>}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores or owners…"
            className="input-base pl-9 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 text-xs font-bold uppercase tracking-wider">
                {['Store', 'Owner', 'Category', 'Location', 'Applied', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="py-3 px-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredShops.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <p className="text-3xl mb-2">📋</p>
                    No {filter !== 'all' ? filter : ''} applications found
                  </td>
                </tr>
              ) : (
                filteredShops.map((shop) => (
                  <ShopRow
                    key={shop._id}
                    shop={shop}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onModify={handleModify}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        <div className="px-5 py-3.5 border-t border-slate-150 flex items-center justify-between">
          <p className="text-xs text-slate-550 font-bold">
            Showing <span className="text-slate-750 font-black">{filteredShops.length}</span> of{' '}
            <span className="text-slate-750 font-black">{shops.length}</span> registrations
          </p>
          {counts.pending > 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full font-bold animate-pulse-ring">
              ⏳ {counts.pending} application{counts.pending !== 1 ? 's' : ''} awaiting review
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
