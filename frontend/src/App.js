import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleLayout from './components/layout/RoleLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import './App.css';

const DashboardRouter = () => {
  const { user } = useContext(AuthContext);
  
  if (!user) return <Navigate to="/login" />;
  
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'doctor':
      return <Navigate to="/doctor" replace />;
    case 'patient':
      return <Navigate to="/patient" replace />;
    default:
      return <Navigate to="/login" />;
  }
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/patient"
              element={
                <ProtectedRoute roles={['patient']}>
                  <RoleLayout>
                    <PatientDashboard />
                  </RoleLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor"
              element={
                <ProtectedRoute roles={['doctor']}>
                  <RoleLayout>
                    <DoctorDashboard />
                  </RoleLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <RoleLayout>
                    <AdminDashboard />
                  </RoleLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
