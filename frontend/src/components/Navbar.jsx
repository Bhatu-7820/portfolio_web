import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, LogOut, ShieldCheck, Command, Sparkles } from 'lucide-react';

const Navbar = ({ onSearchChange, searchTerm = '' }) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 glass-panel border-b border-white/20 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Global Search Input */}
      <div className="flex items-center gap-3 w-80 sm:w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads, campaigns, templates..."
            value={searchTerm}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full glass-input rounded-xl pl-9 pr-12 py-1.5 text-xs text-white placeholder-slate-400"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] text-slate-300 bg-white/10 border border-white/20 px-1.5 py-0.5 rounded-md font-mono">
            <Command className="w-2.5 h-2.5" /> K
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* System Active Badge */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1 rounded-full glass-badge-emerald text-[11px] font-bold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>MongoDB Live</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-xl glass-button-secondary relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-white" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute top-1.5 right-1.5 ring-4 ring-emerald-500/30" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 glass-panel rounded-2xl shadow-2xl p-4 text-xs z-50 border border-white/25 animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/15 pb-2.5 mb-2.5 font-bold text-white">
                <span>System Notifications</span>
                <span className="text-[10px] glass-badge-emerald px-2 py-0.5 rounded-md font-bold">Online</span>
              </div>
              <div className="space-y-2 text-slate-200">
                <div className="p-2.5 rounded-xl glass-card">
                  <p className="font-semibold text-white">Nodemailer Dispatch Active</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">SMTP connection is configured and ready for campaign outreach.</p>
                </div>
                <div className="p-2.5 rounded-xl glass-card">
                  <p className="font-semibold text-white">Lead Discovery Engine Ready</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Web scraper & enrichment API engine initialized.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl glass-button-secondary text-left"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-extrabold text-white text-xs shadow-lg shadow-emerald-500/30 border border-white/30">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block">
              <span className="block text-xs font-bold text-white leading-tight">{user?.name || 'User'}</span>
              <span className="block text-[10px] text-slate-300 font-mono truncate max-w-[120px]">{user?.email || 'user@emailpro.com'}</span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl shadow-2xl p-2 text-xs z-50 border border-white/25 animate-fade-in">
              <div className="px-3 py-2 border-b border-white/15 mb-1">
                <p className="font-bold text-white">{user?.name}</p>
                <p className="text-slate-300 text-[11px] font-mono truncate">{user?.email}</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-semibold">JWT Session Verified</span>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/15 rounded-xl transition font-semibold text-left mt-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
