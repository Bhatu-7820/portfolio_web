import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Users,
  UploadCloud,
  Layers,
  Megaphone,
  FileCode,
  Send,
  BarChart3,
  Settings as SettingsIcon,
  MailCheck,
  Zap
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Lead Discovery', path: '/lead-generation', icon: Sparkles, badge: 'API' },
    { name: 'Lead Database', path: '/leads', icon: Users },
    { name: 'Upload & Media', path: '/upload', icon: UploadCloud },
    { name: 'Classification', path: '/classification', icon: Layers },
    { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
    { name: 'Email Templates', path: '/templates', icon: FileCode },
    { name: 'Send Email', path: '/send-email', icon: Send },
    { name: 'Analytics Logs', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-white/20 flex flex-col justify-between shrink-0 min-h-screen z-20">
      <div>
        {/* Brand Logo Header */}
        <div className="h-16 px-6 flex items-center border-b border-white/15">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 border border-white/30">
              <MailCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-tight flex items-center gap-1">
                Email<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Pro</span>
              </span>
              <span className="block text-[9px] text-slate-400 font-mono tracking-widest uppercase">SaaS Outreach Engine</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3.5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'glass-button-primary text-white font-bold shadow-lg border border-white/40'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md glass-badge-emerald">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Engine Status Banner */}
      <div className="p-4 border-t border-white/15">
        <div className="p-3 rounded-2xl glass-card text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> Engine Live
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-500/30" />
          </div>
          <p className="text-slate-300 text-[10px] leading-relaxed">
            Connected to MongoDB & Nodemailer dispatch service.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
