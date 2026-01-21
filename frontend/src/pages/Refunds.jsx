import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AUTH_HEADERS = {
    'x-api-key': 'key_test_abc123',
    'x-api-secret': 'secret_test_xyz789'
};

const Refunds = () => {
    const [payments, setPayments] = useState([]);
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const paymentsRes = await axios.get('http://localhost:8000/api/v1/payments', { headers: AUTH_HEADERS });
            setPayments(paymentsRes.data.filter(p => p.status === 'success'));

            const refundsRes = await axios.get('http://localhost:8000/api/v1/payments/refunds', { headers: AUTH_HEADERS });
            setRefunds(refundsRes.data.data);
        } catch (err) {
            console.error("Fetch error:", err);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // NEW HELPER: Check if a refund already exists for this payment
    const isAlreadyRefunded = (paymentId) => {
        return refunds.some(r => r.payment_id === paymentId);
    };

    const handleRefundAction = async (paymentId, fullAmount) => {
        const reason = prompt("Enter reason for refund:");
        if (reason === null) return;

        setLoading(true);
        try {
            await axios.post(`http://localhost:8000/api/v1/payments/${paymentId}/refunds`, 
                { amount: fullAmount, reason: reason }, 
                { headers: AUTH_HEADERS }
            );
            alert("Refund job enqueued!");
            fetchData();
        } catch (err) {
            alert(err.response?.data?.detail?.error?.description || "Refund failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8" data-test-id="refunds-management">
            <h1 className="text-3xl font-bold text-gray-900">Refund Management</h1>

            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                    <h2 className="font-bold text-gray-700">Eligible Successful Payments</h2>
                </div>
                <table className="w-full text-left">
                    <thead className="text-xs font-bold text-gray-500 uppercase border-b">
                        <tr>
                            <th className="p-4">Payment ID</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {payments.map(p => {
                            // FIX: Determine if button should be hidden
                            const hasRefund = isAlreadyRefunded(p.id);
                            
                            return (
                                <tr key={p.id}>
                                    <td className="p-4 font-mono text-sm text-blue-600">{p.id}</td>
                                    <td className="p-4 font-bold">₹{(p.amount / 100).toFixed(2)}</td>
                                    <td className="p-4">
                                        {hasRefund ? (
                                            // Show disabled state or badge if already refunded
                                            <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-3 py-1 rounded">
                                                Refunded
                                            </span>
                                        ) : (
                                            <button 
                                                onClick={() => handleRefundAction(p.id, p.amount)}
                                                disabled={loading}
                                                className="bg-red-50 text-red-600 px-4 py-1 rounded-md font-bold hover:bg-red-600 hover:text-white transition-all text-xs"
                                            >
                                                REFUND FULL
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </section>

            {/* Refund History Table remains same */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                    <h2 className="font-bold text-gray-700">Refund Status (Auto-refreshing)</h2>
                </div>
                <table className="w-full text-left">
                    <thead className="text-xs font-bold text-gray-500 uppercase border-b">
                        <tr>
                            <th className="p-4">Refund ID</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Updated At</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {refunds.map(r => (
                            <tr key={r.id}>
                                <td className="p-4 font-mono text-xs">{r.id}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black ${
                                        r.status === 'processed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {r.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-4 text-xs text-gray-500">
                                    {r.processed_at ? new Date(r.processed_at).toLocaleTimeString() : 'Waiting for worker...'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default Refunds;