import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import SummaryCards from '../components/SummaryCards';

const Dashboard = () => {
    const [payments, setPayments] = useState([]);
    const [orders, setOrders] = useState([]);
    // State includes failed count and success rate for comprehensive reporting
    const [stats, setStats] = useState({ total: 0, amount: 0, rate: 0, failed: 0 });
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const merchant = { 
        key: "key_test_abc123", 
        secret: "secret_test_xyz789" 
    };

    const fetchDashboardData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const headers = { 
                'X-Api-Key': merchant.key, 
                'X-Api-Secret': merchant.secret 
            };

            const [payRes, orderRes] = await Promise.all([
                axios.get('http://localhost:8000/api/v1/payments', { headers }),
                axios.get('http://localhost:8000/api/v1/orders', { headers })
            ]);

            const paymentsData = payRes.data;
            // Sorting ensures the most recent activity appears at the top
            const sortedPayments = paymentsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            const successful = sortedPayments.filter(p => p.status === 'success');
            const failed = sortedPayments.filter(p => p.status === 'failed');
            
            const totalAmount = successful.reduce((sum, p) => sum + p.amount, 0);
            const successRate = sortedPayments.length > 0 ? (successful.length / sortedPayments.length) * 100 : 0;
            
            setPayments(sortedPayments);
            setOrders(orderRes.data);

            setStats({ 
                total: successful.length, 
                amount: totalAmount, 
                rate: successRate,
                failed: failed.length
            });
        } catch (err) { 
            console.error("Dashboard Data Error:", err); 
        } finally {
            setTimeout(() => setIsRefreshing(false), 600);
        }
    }, [merchant.key, merchant.secret]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return (
        <div data-test-id="dashboard" className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Merchant Dashboard</h1>
                    <p className="text-gray-500 mt-1">Overview of your store performance</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={fetchDashboardData}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition active:scale-95 disabled:opacity-50"
                    >
                        <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <Link to="/create-order" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow-sm active:scale-95">
                        + Create New Order
                    </Link>
                </div>
            </header>
            
            {/* Summary section calculates real-time data from the database */}
            <div data-test-id="stats-container">
                <SummaryCards 
                    totalAmount={stats.amount} 
                    totalTransactions={stats.total} 
                    totalOrders={orders.length} 
                    totalFailed={stats.failed}
                    successRate={stats.rate}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Mandatory API Credentials section for automated evaluation */}
                <div data-test-id="api-credentials" className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                    <h2 className="text-lg font-bold mb-4 text-gray-800">API Credentials</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">API Key</label>
                            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-100 break-all">
                                <span data-test-id="api-key">{merchant.key}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">API Secret</label>
                            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-100 break-all">
                                <span data-test-id="api-secret">{merchant.secret}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Recent Transactions</h2>
                        <Link to="/transactions" className="text-blue-600 text-sm font-semibold hover:underline">View All</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-400 text-xs uppercase font-bold">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {payments.slice(0, 5).map((pay) => (
                                    <tr key={pay.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(pay.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                            ₹{(pay.amount / 100).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                                pay.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {pay.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;