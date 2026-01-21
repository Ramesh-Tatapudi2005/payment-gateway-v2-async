import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('merchantEmail');
    window.location.href = '/login';
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Orders', path: '/orders', icon: '📦' },
    { name: 'Transactions', path: '/transactions', icon: '💳' },
    { name: 'Refunds', path: '/refunds', icon: '💰' }, // NEW: Added for Task 7.1
    { name: 'Create Order', path: '/create-order', icon: '➕' },
    { name: 'Webhooks', path: '/webhooks', icon: '🔗' },
    { name: 'API Docs', path: '/docs', icon: '📚' },
  ];

  return (
    <div className="w-64 bg-white shadow-md min-h-screen p-4 flex flex-col border-r border-gray-100">
      <div className="text-2xl font-bold text-blue-600 mb-8 px-2">PG Merchant</div>
      
      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              location.pathname === item.path 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-start space-x-2 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-semibold group"
        >
          <span>Logout 🚪</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;