import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Spinner from './components/common/Spinner';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';

// Citizen Portal Pages
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import ReportDisasterPage from './pages/citizen/ReportDisasterPage';
import ReportTrackingPage from './pages/citizen/ReportTrackingPage';
import CitizenAssistancePage from './pages/citizen/CitizenAssistancePage';
import CitizenSheltersPage from './pages/citizen/CitizenSheltersPage';

// Officer / Command Center Pages
import CommandDashboard from './pages/command/CommandDashboard';
import VerificationQueuePage from './pages/officer/VerificationQueuePage';
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
import OfficerClosurePage from './pages/officer/OfficerClosurePage';
import OfficerAnalyticsPage from './pages/officer/OfficerAnalyticsPage';

// Coordinator Portal Pages
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import CoordinatorRequestsPage from './pages/coordinator/CoordinatorRequestsPage';
import CoordinatorDeliveriesPage from './pages/coordinator/CoordinatorDeliveriesPage';
import CoordinatorInventoryPage from './pages/coordinator/CoordinatorInventoryPage';

// Field Responder & Provider Pages
import ResponderDashboard from './pages/responder/ResponderDashboard';
import ResponderMissions from './pages/responder/ResponderMissions';
import ResponderHistory from './pages/responder/ResponderHistory';
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
        <Spinner size="lg" text="Authenticating session with Oracle UDRRMS database..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.roleName)) {
    if (user.roleName === 'CITIZEN') {
      return <Navigate to="/citizen/dashboard" replace />;
    }
    if (user.roleName === 'COORDINATOR' || user.roleName === 'RESOURCE_PROVIDER') {
      return <Navigate to="/coordinator/dashboard" replace />;
    }
    return <Navigate to="/officer/dashboard" replace />;
  }

  return children;
}

// Root Role-Based Landing Redirect
function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <Spinner size="lg" text="Connecting to Oracle database..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.roleName === 'CITIZEN') {
    return <Navigate to="/citizen/dashboard" replace />;
  }
  if (user.roleName === 'COORDINATOR' || user.roleName === 'RESOURCE_PROVIDER') {
    return <Navigate to="/coordinator/dashboard" replace />;
  }
  return <Navigate to="/officer/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public Login & Register */}
      <Route path="/login" element={<LoginPage />} />

      {/* Root Landing Dispatcher */}
      <Route path="/" element={<RootRedirect />} />

      {/* 1. Citizen Portal (RBAC: CITIZEN) */}
      <Route
        path="/citizen"
        element={
          <ProtectedRoute allowedRoles={['CITIZEN']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/citizen/dashboard" replace />} />
        <Route path="dashboard" element={<CitizenDashboard />} />
        <Route path="report" element={<ReportDisasterPage />} />
        <Route path="tracking" element={<ReportTrackingPage />} />
        <Route path="assistance" element={<CitizenAssistancePage />} />
        <Route path="shelters" element={<CitizenSheltersPage />} />
      </Route>

      {/* 2. Disaster Officer Portal (RBAC: DISASTER_OFFICER, COMMAND_CENTER) */}
      <Route
        path="/officer"
        element={
          <ProtectedRoute allowedRoles={['DISASTER_OFFICER', 'COMMAND_CENTER']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/officer/dashboard" replace />} />
        <Route path="dashboard" element={<CommandDashboard />} />
        <Route path="verification" element={<VerificationQueuePage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="incidents/:id" element={<IncidentDetailPage />} />
        <Route path="teams" element={<RespondersPage />} />
        <Route path="missions" element={<MissionsPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="shelters" element={<SheltersPage />} />
        <Route path="warehouses" element={<WarehousesPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="closure" element={<OfficerClosurePage />} />
        <Route path="analytics" element={<OfficerAnalyticsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Route>

      {/* 2b. Command Center Direct Routes */}
      <Route
        path="/command"
        element={
          <ProtectedRoute allowedRoles={['DISASTER_OFFICER', 'COMMAND_CENTER']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/command/dashboard" replace />} />
        <Route path="dashboard" element={<CommandDashboard />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="incidents/:id" element={<IncidentDetailPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="missions" element={<MissionsPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="responders" element={<RespondersPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="shelters" element={<SheltersPage />} />
        <Route path="warehouses" element={<WarehousesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Route>

      {/* 3. Relief Coordinator Portal (RBAC: COORDINATOR, RESOURCE_PROVIDER) */}
      <Route
        path="/coordinator"
        element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'RESOURCE_PROVIDER']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/coordinator/dashboard" replace />} />
        <Route path="dashboard" element={<CoordinatorDashboard />} />
        <Route path="requests" element={<CoordinatorRequestsPage />} />
        <Route path="deliveries" element={<CoordinatorDeliveriesPage />} />
        <Route path="inventory" element={<CoordinatorInventoryPage />} />
      </Route>

      {/* 4. Tactical Field Responder Portal (RBAC: FIELD_RESPONDER, COMMAND_CENTER, DISASTER_OFFICER) */}
      <Route
        path="/responder"
        element={
          <ProtectedRoute allowedRoles={['FIELD_RESPONDER', 'COMMAND_CENTER', 'DISASTER_OFFICER']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/responder/dashboard" replace />} />
        <Route path="dashboard" element={<ResponderDashboard />} />
        <Route path="missions" element={<ResponderMissions />} />
        <Route path="history" element={<ResponderHistory />} />
      </Route>

      {/* 5. Resource Provider Portal (RBAC: RESOURCE_PROVIDER, COORDINATOR, COMMAND_CENTER) */}
      <Route
        path="/provider"
        element={
          <ProtectedRoute allowedRoles={['RESOURCE_PROVIDER', 'COORDINATOR', 'COMMAND_CENTER']}>
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
