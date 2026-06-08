import React from 'react';
import PickupTickets from '../../components/buyer/PickupTickets';

export default function MyOrders() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2 font-medium">
            <span>Discover</span>
            <span>›</span>
            <span className="text-gray-700 font-semibold">My Tickets</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
            🎟️ My Pickup Tickets
          </h1>
          <p className="text-gray-500 text-sm mt-1.5">
            Track your orders and show PINs at the store counter to collect.
          </p>
        </div>
      </div>
      <PickupTickets />
    </div>
  );
}

