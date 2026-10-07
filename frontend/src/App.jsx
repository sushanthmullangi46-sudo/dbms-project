import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Spinner from './components/common/Spinner';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';

// Command Center Pages
import CommandDashboard from './pages/command/CommandDashboard';
import IncidentsPage from './pages/command/IncidentsPage';
import IncidentDetailPage from './pages/command/IncidentDetailPage';
import RequestsPage from './pages/command/RequestsPage';
import MissionsPage from './pages/command/MissionsPage';
import ResourcesPage from './pages/command/ResourcesPage';
import RespondersPage from './pages/command/RespondersPage';
import InventoryPage from './pages/command/InventoryPage';
import SheltersPage from './pages/command/SheltersPage';
import WarehousesPage from './pages/command/WarehousesPage';
import MapPage from './pages/command/MapPage';
import ReportsPage from './pages/command/ReportsPage';
import AuditLogsPage from './pages/command/AuditLogsPage';

// Field Responder Pages
import ResponderDashboard from './pages/responder/ResponderDashboard';
import ResponderMissions from './pages/responder/ResponderMissions';
import ResponderHistory from './pages/responder/ResponderHistory';

// Resource Provider Pages
import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderResources from './pages/provider/ProviderResources';
import ProviderAllocations from './pages/provider/ProviderAllocations';
import ProviderHandovers from './pages/provider/ProviderHandovers';

// RBAC Protected Route Component
function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <Spinner size="lg" text="Authenticating tactical session with Oracle..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.roleName)) {
    // Redirect to default dashboard for user's role
    if (user.roleName === 'FIELD_RESPONDER') {
      return <Navigate to="/responder/dashboard" replace />;
    }
    if (user.roleName === 'RESOURCE_PROVIDER') {
      return <Navigate to="/provider/dashboard" replace />;
    }
    return <Navigate to="/command/dashboard" replace />;
  }

  return children;
}

// Root Role-Based Landing Redirect
function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <Spinner size="lg" text="Connecting to Oracle emergency database..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.roleName === 'FIELD_RESPONDER') {
    return <Navigate to="/responder/dashboard" replace />;
  }
  if (user.roleName === 'RESOURCE_PROVIDER') {
    return <Navigate to="/provider/dashboard" replace />;
  }
  return <Navigate to="/command/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Root Landing Dispatcher */}
      <Route path="/" element={<RootRedirect />} />

      {/* Command Center Portal (RBAC Protected: COMMAND_CENTER) */}
      <Route
        path="/command"
        element={
          <ProtectedRoute allowedRoles={['COMMAND_CENTER']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/command/dashboard" replace />} />
        <Route path="dashboard" element={<CommandDashboard />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="incidents/:id" element={<IncidentDetailPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="missions" element={<MissionsPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="responders" element={<RespondersPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="shelters" element={<SheltersPage />} />
        <Route path="warehouses" element={<WarehousesPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Route>

      {/* Field Responder Portal (RBAC Protected: FIELD_RESPONDER) */}
      <Route
        path="/responder"
        element={
          <ProtectedRoute allowedRoles={['FIELD_RESPONDER']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/responder/dashboard" replace />} />
        <Route path="dashboard" element={<ResponderDashboard />} />
        <Route path="missions" element={<ResponderMissions />} />
        <Route path="history" element={<ResponderHistory />} />
      </Route>

      {/* Resource Provider Portal (RBAC Protected: RESOURCE_PROVIDER) */}
      <Route
        path="/provider"
        element={
          <ProtectedRoute allowedRoles={['RESOURCE_PROVIDER']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/provider/dashboard" replace />} />
        <Route path="dashboard" element={<ProviderDashboard />} />
        <Route path="resources" element={<ProviderResources />} />
        <Route path="allocations" element={<ProviderAllocations />} />
        <Route path="handovers" element={<ProviderHandovers />} />
      </Route>

      {/* Catch-all Wildcard Route */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
