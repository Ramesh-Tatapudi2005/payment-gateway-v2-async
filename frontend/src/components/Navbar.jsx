import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const location = useLocation();
    
    const isActive = (path) => location.pathname === path ? "bg-blue-700" : "";

    return (
        <nav className="bg-blue-600 text-white shadow-lg mb-6">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-8">
                        <span className="text-xl font-bold tracking-tight">Gateway Portal</span>
                        <div className="hidden md:flex space-x-4">
                            <Link to="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500 ${isActive('/dashboard')}`}>
                                Home
                            </Link>
                            <Link to="/webhooks" className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500 ${isActive('/webhooks')}`}>
                                Webhooks
                            </Link>
                            <Link to="/docs" className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500 ${isActive('/docs')}`}>
                                Documentation
                            </Link>
                        </div>
                    </div>
                    <div className="text-sm font-medium opacity-80">
                        Merchant Portal (Authenticated)
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;