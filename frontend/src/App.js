import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Existing Pages
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Orders from './pages/Orders'; 
import CreateOrder from './pages/CreateOrder';
import Login from './pages/Login';

// NEW: Task 7.1 Pages
import Webhooks from './pages/Webhooks';
import Docs from './pages/Docs';
import Refunds from './pages/Refunds'; // Added for Refund Management

// Components
import Sidebar from './components/Sidebar'; 

function App() {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        {isAuthenticated && <Sidebar />}
        
        <main className="flex-1">
          <div className="max-w-7xl mx-auto">
            <Routes>
              {/* AUTH ROUTE */}
              <Route 
                path="/login" 
                element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} 
              />

              {/* PROTECTED ROUTES */}
              <Route 
                path="/dashboard" 
                element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} 
              />
              
              <Route 
                path="/transactions" 
                element={isAuthenticated ? <Transactions /> : <Navigate to="/login" replace />} 
              />

              {/* NEW: Refund Management Route */}
              <Route 
                path="/refunds" 
                element={isAuthenticated ? <Refunds /> : <Navigate to="/login" replace />} 
              />
              
              <Route 
                path="/orders" 
                element={isAuthenticated ? <Orders /> : <Navigate to="/login" replace />} 
              />
              
              <Route 
                path="/create-order" 
                element={isAuthenticated ? <CreateOrder /> : <Navigate to="/login" replace />} 
              />

              <Route 
                path="/webhooks" 
                element={isAuthenticated ? <Webhooks /> : <Navigate to="/login" replace />} 
              />

              <Route 
                path="/docs" 
                element={isAuthenticated ? <Docs /> : <Navigate to="/login" replace />} 
              />

              {/* DEFAULT NAVIGATION */}
              <Route 
                path="/" 
                element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
              />
              
              <Route 
                path="*" 
                element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
              />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;