import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import ExternalJobDetailPage from './pages/ExternalJobDetailPage';
import StudentDashboard from './pages/StudentDashboard';
import RecruiterDashboard from './pages/RecruiterDashBoard';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import PostJobPage from './pages/PostJobPage';
import CompanyPage from './pages/CompanyPage';
import SavedJobsPage from './pages/SavedJobsPage';
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage';
import NotFoundPage from './pages/NotFoundPage';

// Layout
import Navbar from './components/shared/Navbar';
import Footer from './components/shared/Footer';

const PrivateRoute = ({ children, roles }) => {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { token } = useAuth();
  if (token) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/external-jobs/:externalId" element={<ExternalJobDetailPage />} />

        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        <Route path="/dashboard" element={<PrivateRoute roles={['student']}><StudentDashboard /></PrivateRoute>} />
        <Route path="/recruiter" element={<PrivateRoute roles={['recruiter']}><RecruiterDashboard /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/post-job" element={<PrivateRoute roles={['recruiter']}><PostJobPage /></PrivateRoute>} />
        <Route path="/company" element={<PrivateRoute roles={['recruiter']}><CompanyPage /></PrivateRoute>} />
        <Route path="/saved-jobs" element={<PrivateRoute roles={['student']}><SavedJobsPage /></PrivateRoute>} />
        <Route path="/resume-analyzer" element={<PrivateRoute roles={['student']}><ResumeAnalyzerPage /></PrivateRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
    <Footer />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}