import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';

// Import components
import AppNavbar from './components/Navbar'; // Use the new name

// Import page components
import LoginPage from './pages/LoginPage';
import FirstLoginPage from './pages/FirstLoginPage';
import RequestPasswordResetPage from './pages/RequestPasswordResetPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DoctorDashboard from './pages/DoctorDashboard';
import IssueCertificatePage from './pages/IssueCertificatePage';
import AdminDashboard from './pages/AdminDashboard';
import ManageDoctorsPage from './pages/ManageDoctorsPage';
import VerificationPage from './pages/VerificationPage';
import NotFoundPage from './pages/NotFoundPage';
import DoctorHistoryPage from './pages/DoctorHistoryPage';
import DoctorProfilePage from './pages/DoctorProfilePage';
import AddDoctorPage from './pages/AddDoctorPage';
import CertificateDetailsPage from './pages/CertificateDetailsPage';

// Import ProtectedRoute
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';

function App() {
  return (
    <AuthProvider> {/* Wrap everything with AuthProvider */}
      <BrowserRouter>
        <AppNavbar /> {/* Use AppNavbar here */}
        <div className="container mt-3"> {/* Add Bootstrap container */}
          <Routes>
            {/* Public Auth Routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/first-login" element={<FirstLoginPage />} />
              <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              <Route path="/" element={<LoginPage />} />
            </Route>

            {/* Public Verification Route */}
            <Route path="/verification" element={<VerificationPage />} />
            {/* Verification route with optional ID */}
            <Route path="/verification/:qrId" element={<VerificationPage />} />


            {/* Doctor Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
              <Route path="/doctor/issue-certificate" element={<IssueCertificatePage />} />
              <Route path="/doctor/history" element={<DoctorHistoryPage />} />
              <Route path="/doctor/profile" element={<DoctorProfilePage />} />
              <Route path="/doctor/certificate/:id" element={<CertificateDetailsPage />} />
              {/* Add other doctor-specific routes here */}
            </Route>

            {/* Admin Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['dgtt_admin', 'dgtt_staff']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              {/* Route accessible only to dgtt_admin */}
              <Route element={<ProtectedRoute allowedRoles={['dgtt_admin']} />}>
                <Route path="/admin/doctors" element={<ManageDoctorsPage />} />
                <Route path="/admin/add-doctor" element={<AddDoctorPage />} />
                {/* Add other admin-only routes here */}
              </Route>
              {/* Add other admin/staff routes here */}
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;