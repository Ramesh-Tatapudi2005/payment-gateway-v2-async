import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Orders = () => {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // Fetching all orders with Merchant Credentials
                const res = await axios.get('http://localhost:8000/api/v1/orders', {
                    headers: { 
                        'X-Api-Key': 'key_test_abc123', 
                        'X-Api-Secret': 'secret_test_xyz789' 
                    }
                });
                // Sort by date to show newest orders first
                const sortedOrders = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setOrders(sortedOrders);
            } catch (err) {
                console.error("Error fetching orders:", err);
            }
        };
        fetchOrders();
    }, []);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Order History</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map((order) => {
                    // Logic: Action Required disappears if status is 'paid'
                    const isPaid = order.status === 'paid' || order.status === 'completed';
                    
                    const cardBaseClasses = "block bg-white p-6 rounded-2xl shadow-sm border transition-all duration-300";
                    const interactiveClasses = "border-blue-100 hover:border-blue-400 hover:shadow-md cursor-pointer";
                    const staticClasses = "border-gray-100 cursor-default opacity-90";

                    const CardInner = (
                        <>
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    {formatDate(order.created_at)}
                                </span>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                    isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {order.status.toUpperCase()}
                                </span>
                            </div>
                            
                            <p className="text-sm font-mono text-blue-600 mb-2 truncate">{order.id}</p>
                            
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm text-gray-500 font-medium">Amount:</span>
                                <span className="text-2xl font-black text-gray-900">₹{(order.amount / 100).toFixed(2)}</span>
                            </div>

                            {/* Link only appears if not paid */}
                            {!isPaid && (
                                <div className="mt-4 pt-4 border-t border-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center gap-1">
                                    Complete Payment →
                                </div>
                            )}
                        </>
                    );

                    return (
                        <div key={order.id} className="relative group">
                            {/* Visual indicator for unpaid orders only */}
                            {!isPaid && (
                                <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg z-10 animate-pulse">
                                    ACTION REQUIRED
                                </div>
                            )}

                            {isPaid ? (
                                <div className={`${cardBaseClasses} ${staticClasses}`}>
                                    {CardInner}
                                </div>
                            ) : (
                                <a 
                                    href={`http://localhost:3001/checkout?order_id=${order.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`${cardBaseClasses} ${interactiveClasses}`}
                                >
                                    {CardInner}
                                </a>
                            )}
                        </div>
                    );
                })}
                
                {orders.length === 0 && (
                    <div className="col-span-full bg-white p-12 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                        <p className="text-gray-400 font-medium">No orders found in your history.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;