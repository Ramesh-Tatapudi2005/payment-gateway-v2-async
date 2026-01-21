import React from 'react';

const SummaryCards = ({ totalAmount, totalTransactions, totalOrders, totalFailed, successRate }) => {
  const safeTotalAmount = totalAmount || 0;
  const safeSuccessRate = successRate || 0;

  // Helper to determine which test-id belongs to which card value
  const getTestId = (name) => {
    switch (name) {
      case 'Total Revenue': return 'total-amount';
      case 'Successful Payments': return 'total-transactions';
      default: return null;
    }
  };

  const stats = [
    { 
      name: 'Total Revenue', 
      value: `₹${(safeTotalAmount / 100).toFixed(2)}`, 
      icon: '💰', 
      color: 'text-green-600', 
      bg: 'bg-green-100' 
    },
    { 
      name: 'Successful Payments', 
      value: totalTransactions || 0, 
      icon: '✅', 
      color: 'text-blue-600', 
      bg: 'bg-blue-100' 
    },
    { 
      name: 'Failed Payments', 
      value: totalFailed || 0, 
      icon: '❌', 
      color: 'text-red-600', 
      bg: 'bg-red-100' 
    },
    { 
      name: 'Total Orders', 
      value: totalOrders || 0, 
      icon: '📦', 
      color: 'text-purple-600', 
      bg: 'bg-purple-100' 
    },
  ];

  return (
    <div 
      key={totalTransactions} 
      data-test-id="stats-container" 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700"
    >
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md hover:-translate-y-1">
          <div className={`${stat.bg} ${stat.color} p-4 rounded-xl mr-4 text-2xl flex items-center justify-center shadow-inner`}>
            {stat.icon}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-500 whitespace-nowrap truncate">{stat.name}</p>
            <div className="flex items-baseline gap-2">
              {/* Mandatory IDs applied to specific value containers */}
              <p className="text-2xl font-bold text-gray-900">
                <span data-test-id={getTestId(stat.name)}>
                    {stat.value}
                </span>
              </p>
              
              {/* Mandatory Success Rate ID */}
              {stat.name === 'Successful Payments' && (
                <span 
                  data-test-id="success-rate" 
                  className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100"
                >
                  {safeSuccessRate.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;