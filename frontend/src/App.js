import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Agent from './pages/Agent';
import ProductDescription from './pages/ProductDescription';
import ICPSelection from './pages/ICPSelection';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/agent" element={
            <ProtectedRoute>
              <Layout>
                <Agent />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/product-description" element={
            <ProtectedRoute>
              <Layout>
                <ProductDescription />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/icp-selection" element={
            <ProtectedRoute>
              <Layout>
                <ICPSelection />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
