import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Flame, 
  PhoneCall, 
  Compass, 
  Boxes, 
  Users, 
  Package, 
  Home, 
  Building2, 
  Map, 
  BarChart3, 
  FileText,
  Truck,
  ArrowRightLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user, isCommandCenter, isResponder, isProvider } = useAuth();

  let navLinks = [];

  if (isCommandCenter) {
    navLinks = [
      { name: 'Dashboard', path: '/command/dashboard', icon: LayoutDashboard },
      { name: 'Incidents', path: '/command/incidents', icon: Flame },
      { name: 'Emergency Requests', path: '/command/requests', icon: PhoneCall },
      { name: 'Tactical Missions', path: '/command/missions', icon: Compass },
      { name: 'Resource Catalog', path: '/command/resources', icon: Boxes },
      { name: 'Field Responders', path: '/command/responders', icon: Users },
      { name: 'Warehouse Inventory', path: '/command/inventory', icon: Package },
      { name: 'Relief Shelters', path: '/command/shelters', icon: Home },
      { name: 'Warehouses', path: '/command/warehouses', icon: Building2 },
      { name: 'Disaster Map', path: '/command/map', icon: Map },
      { name: 'SQL Analytics & Reports', path: '/command/reports', icon: BarChart3 },
      { name: 'Audit Logs', path: '/command/audit-logs', icon: FileText }
    ];
  } else if (isResponder) {
    navLinks = [
      { name: 'Responder Dashboard', path: '/responder/dashboard', icon: LayoutDashboard },
      { name: 'Assigned Missions', path: '/responder/missions', icon: Compass },
      { name: 'Mission History', path: '/responder/history', icon: FileText }
    ];
  } else if (isProvider) {
    navLinks = [
      { name: 'Provider Dashboard', path: '/provider/dashboard', icon: LayoutDashboard },
      { name: 'My Resources & Fleet', path: '/provider/resources', icon: Boxes },
      { name: 'Mission Allocations', path: '/provider/allocations', icon: Truck },
      { name: 'Resource Handovers', path: '/provider/handovers', icon: ArrowRightLeft }
    ];
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 space-x-3">
        <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-500">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wider text-white">UDR-ORP</h1>
          <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">Emergency Command</p>
        </div>
      </div>

      {/* Role Tag */}
      <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-900/40">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Workspace</div>
        <div className="text-xs font-semibold text-brand-400 mt-0.5 tracking-wide">
          {user?.roleName?.replace('_', ' ')}
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 mr-3 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Database Badge */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono text-slate-300">Oracle Database Live</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">22 Normalized Tables | 3NF</p>
      </div>
    </aside>
  );
}
