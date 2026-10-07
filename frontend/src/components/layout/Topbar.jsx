import React from 'react';
import { LogOut, User as UserIcon, Bell, Radio } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Platform Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-xs font-mono px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>STATUS: OPERATIONAL</span>
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">|</span>
        <span className="text-xs text-slate-400 hidden sm:inline">Scenario: Bangalore North Flood</span>
      </div>

      {/* User Controls */}
      <div className="flex items-center space-x-4">
        {/* User Info */}
        <div className="flex items-center space-x-3 border-r border-slate-800 pr-4">
          <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-xs">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-semibold text-white leading-tight">{user?.fullName}</p>
            <p className="text-[10px] text-slate-400 font-mono">{user?.email}</p>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={logout}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 border border-slate-700 transition-all"
          title="Sign out of system"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
