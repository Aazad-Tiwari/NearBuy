import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { buyerAPI } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function NotificationsBell() {
  const { toasts } = useApp(); // watch toasts to re-fetch when notify() is called
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleItemClick = async (item) => {
    if (!item.isRead) {
      try {
        await buyerAPI.markNotificationRead(item._id);
        setNotifications(prev => prev.map(n => n._id === item._id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error('Failed to mark read on click:', err);
      }
    }
    setOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await buyerAPI.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [toasts.length]); // re-fetch when new toasts arrive

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await buyerAPI.markNotificationRead(id);
      if (res.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => buyerAPI.markNotificationRead(n._id).catch(() => {})));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getTypeStyle = (type) => {
    switch (type) {
      case 'success': return { emoji: '✅', dot: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' };
      case 'error':   return { emoji: '❌', dot: 'bg-rose-500',    bg: 'bg-rose-50 border-rose-100',       text: 'text-rose-700'   };
      case 'warning': return { emoji: '⚠️', dot: 'bg-amber-500',   bg: 'bg-amber-50 border-amber-100',     text: 'text-amber-700'  };
      default:        return { emoji: 'ℹ️', dot: 'bg-blue-500',    bg: 'bg-blue-50 border-blue-100',       text: 'text-blue-700'   };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center relative transition-all shadow-sm"
        title="View notifications"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 border-2 border-white text-[10px] font-black flex items-center justify-center text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in flex flex-col max-h-[420px]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-rose-100 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold transition-colors"
              >
                Mark all read ✓
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto divide-y divide-gray-50 flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-gray-400 text-xs font-medium">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((item) => {
                const style = getTypeStyle(item.type);
                return (
                  <div
                    key={item._id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 flex items-start gap-3 relative group transition-colors hover:bg-gray-50 cursor-pointer ${
                      !item.isRead ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <span className="text-base mt-0.5 shrink-0">{style.emoji}</span>
                    <div className="flex-1 min-w-0 pr-6">
                      <p className={`text-xs font-bold truncate ${!item.isRead ? 'text-gray-900' : 'text-gray-500'}`}>
                        {item.title}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                        {item.message}
                      </p>
                      <span className="text-[9px] text-gray-300 block mt-1 font-mono">
                        {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {!item.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(item._id, e)}
                        className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white border border-gray-200 text-[9px] text-gray-400 hover:text-blue-600 hover:border-blue-300 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center font-bold shadow-sm"
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
