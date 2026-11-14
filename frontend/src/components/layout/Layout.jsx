import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ErrorBoundary from '../common/ErrorBoundary';
import EmergencyAlertBanner from '../EmergencyAlertBanner';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <EmergencyAlertBanner />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/60">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
