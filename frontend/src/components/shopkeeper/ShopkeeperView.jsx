import React, { useState } from 'react';
import Sidebar from './Sidebar';
import OrdersPanel from './OrdersPanel';
import InventoryPanel from './InventoryPanel';
import ApplyStorePanel from './ApplyStorePanel';
import { useApp } from '../../context/AppContext';

/**
 * ShopkeeperView — sidebar + main content layout
 */
const SECTIONS = { orders: OrdersPanel, inventory: InventoryPanel, apply: ApplyStorePanel };

export default function ShopkeeperView() {
  const { shopkeeperOrders } = useApp();
  const [activeSection, setActiveSection] = useState('orders');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const orderCounts = {
    orders: shopkeeperOrders.filter((o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'packed').length,
  };

  const ActiveSection = SECTIONS[activeSection] || OrdersPanel;

  const handleSectionChange = (id) => {
    setActiveSection(id);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setMobileSidebarOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-40 lg:hidden w-12 h-12 bg-violet-600 hover:bg-violet-500 rounded-full flex items-center justify-center shadow-glow text-white transition-colors"
      >
        {mobileSidebarOpen ? '✕' : '☰'}
      </button>

      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/80 modal-backdrop lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          orderCounts={orderCounts}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-400"
            >
              ☰
            </button>
            <h1 className="text-lg font-bold text-slate-100 text-gradient-shopkeeper">Shopkeeper Panel</h1>
          </div>

          <ActiveSection />
        </div>
      </main>
    </div>
  );
}
