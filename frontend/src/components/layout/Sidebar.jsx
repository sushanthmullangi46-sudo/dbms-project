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
  ArrowRightLeft,
  LifeBuoy,
  PlusCircle,
  Clock,
  HeartHandshake,
  ShieldCheck,
  CheckSquare,
  Warehouse,
  GitMerge
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user, isCitizen, isOfficer, isCoordinator } = useAuth();

  let navLinks = [];

  if (isCitizen) {
    navLinks = [
      { name: 'Citizen Dashboard', path: '/citizen/dashboard', icon: LayoutDashboard },
      { name: 'Report Emergency', path: '/citizen/report', icon: PlusCircle },
      { name: 'Track My Reports', path: '/citizen/tracking', icon: Clock },
      { name: 'Request Assistance', path: '/citizen/assistance', icon: HeartHandshake },
      { name: 'Shelters & Hospitals', path: '/citizen/shelters', icon: Home }
    ];
  } else if (isCoordinator) {
    navLinks = [
      { name: 'Logistics Command', path: '/coordinator/dashboard', icon: LayoutDashboard },
      { name: 'Approval & Allocation', path: '/coordinator/requests', icon: Package },
      { name: 'Dispatch & Delivery', path: '/coordinator/deliveries', icon: Truck },
      { name: 'Warehouses & Stocks', path: '/coordinator/inventory', icon: Warehouse },
      { name: 'Disaster Map', path: '/officer/map', icon: Map },
      { name: 'Post-Incident Analytics', path: '/officer/analytics', icon: BarChart3 }
    ];
  } else {
    // Default to Officer / Command Center
    navLinks = [
      { name: 'Command Dashboard', path: '/officer/dashboard', icon: LayoutDashboard },
      { name: 'Verification Queue', path: '/officer/verification', icon: ShieldCheck },
      { name: 'Active Incidents', path: '/officer/incidents', icon: Flame },
      { name: 'Tactical Rescue Teams', path: '/officer/teams', icon: Compass },
      { name: 'Disaster Operations Map', path: '/officer/map', icon: Map },
      { name: 'Closure Checklist', path: '/officer/closure', icon: CheckSquare },
      { name: 'Operational Analytics', path: '/officer/analytics', icon: BarChart3 },
      { name: 'Audit Trail Logs', path: '/officer/audit-logs', icon: FileText }
    ];
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 space-x-3">
        <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-500">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wider text-white">UDRRMS</h1>
          <p className="text-[9px] text-cyan-400 font-mono tracking-tight uppercase">Emergency Operations</p>
        </div>
      </div>

      {/* Role Tag */}
      <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-900/40">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Role Identity</div>
        <div className="text-xs font-semibold text-rose-400 mt-0.5 tracking-wide flex items-center justify-between">
          <span>{user?.roleName?.replace('_', ' ') || 'CITIZEN'}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <div className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
          {user?.fullName || 'Active Operator'}
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
                `flex items-center px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${
                  isActive
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm font-semibold'
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
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="font-mono text-slate-200">Oracle Database 21c</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">27 Normalized Tables (3NF) • FastAPI</p>
      </div>
    </aside>
  );
}
