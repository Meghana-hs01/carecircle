import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { ProfileProvider } from './context/ProfileContext';

import { ProtectedLayout } from './layouts/ProtectedLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ElderlyDashboard } from './pages/ElderlyDashboard';
import { FamilyDashboard } from './pages/FamilyDashboard';
import { CaretakerDashboard } from './pages/CaretakerDashboard';
import { ProfilePage } from './pages/ProfilePage';
import { MedicationsPage } from './pages/MedicationsPage';
import { AddEditMedicationPage } from './pages/AddEditMedicationPage';
import { MedicationHistoryPage } from './pages/MedicationHistoryPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { TimelinePage } from './pages/TimelinePage';
import { CareCirclePage } from './pages/CareCirclePage';
import { AcceptInvitationPage } from './pages/AcceptInvitationPage';
import { CareActivitiesPage } from './pages/CareActivitiesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AccessibilityPage } from './pages/AccessibilityPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AccessibilityProvider>
        <AuthProvider>
          <ProfileProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Authenticated Protected Routes */}
              <Route element={<ProtectedLayout />}>
                <Route path="/elderly-dashboard" element={<ElderlyDashboard />} />
                <Route path="/family-dashboard" element={<FamilyDashboard />} />
                <Route path="/caretaker-dashboard" element={<CaretakerDashboard />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/medications" element={<MedicationsPage />} />
                <Route path="/medications/new" element={<AddEditMedicationPage />} />
                <Route path="/medication-history" element={<MedicationHistoryPage />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/timeline" element={<TimelinePage />} />
                <Route path="/care-circle" element={<CareCirclePage />} />
                <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
                <Route path="/activities" element={<CareActivitiesPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/accessibility" element={<AccessibilityPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ProfileProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </BrowserRouter>
  );
};

export default App;
