import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Checkout from './pages/Checkout';
import Success from './pages/Success'; // New Import
import Failure from './pages/Failure'; // New Import

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <Routes>
                    {/* MANDATORY: Checkout page accessible at /checkout?order_id=xxx */}
                    <Route path="/checkout" element={<Checkout />} />

                    {/* MANDATORY: Success page to show payment_id after success */}
                    <Route path="/success" element={<Success />} />

                    {/* MANDATORY: Failure page to allow 'Try Again' flow */}
                    <Route path="/failure" element={<Failure />} />

                    {/* Default route redirects to checkout if order_id is missing, 
                        though usually handled by logic inside Checkout.jsx */}
                    <Route path="/" element={<Navigate to="/checkout" replace />} />
                    
                    {/* Catch-all for undefined routes */}
                    <Route path="*" element={<Navigate to="/checkout" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;