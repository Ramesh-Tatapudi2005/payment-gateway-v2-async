import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchTransactions = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/v1/payments', {
                headers: { 
                    'X-Api-Key': 'key_test_abc123', 
                    'X-Api-Secret': 'secret_test_xyz789' 
                }
            });
            const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setTransactions(sorted);
        } catch (err) {
            console.error("Error fetching transactions:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();

        const handleMessage = (event) => {
            if (event.origin !== "http://localhost:3001") return;
            if (event.data === 'payment_complete' || event.data === 'payment_failed') {
                fetchTransactions(); 
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const filteredTransactions = transactions.filter(tx => 
        tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.card_network && tx.card_network.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
                    <p className="text-gray-500">Monitor your payment flows and card network distributions</p>
                </div>
                
                <div className="relative w-full md:w-96">
                    <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                    <input 
                        type="text"
                        placeholder="Search ID, Status, or Network..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                </div>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table data-test-id="transactions-table" className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-400 text-xs uppercase font-bold">
                        <tr>
                            <th className="px-6 py-4">Payment ID</th>
                            <th className="px-6 py-4">Order ID</th>
                            <th className="px-6 py-4">Amount (Paise)</th>
                            <th className="px-6 py-4">Method & Network</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredTransactions.map((tx) => (
                            <tr key={tx.id} data-test-id="transaction-row" data-payment-id={tx.id} className="hover:bg-gray-50 transition">
                                <td data-test-id="payment-id" className="px-6 py-4 text-sm font-mono text-blue-600">{tx.id}</td>
                                <td data-test-id="order-id" className="px-6 py-4 text-sm text-gray-500">{tx.order_id}</td>
                                
                                <td data-test-id="amount" className="px-6 py-4 text-sm font-bold text-gray-900">
                                    {tx.amount} paises
                                </td>
                                
                                <td data-test-id="method" className="px-6 py-4 text-sm text-gray-600">
                                    <div className="flex flex-col">
                                        <span className="font-medium capitalize">{tx.method}</span>
                                        {tx.method === 'card' && (
                                            <span className="text-xs text-gray-400 uppercase">
                                                {tx.card_network} •••• {tx.card_last4}
                                            </span>
                                        )}
                                        {tx.method === 'upi' && (
                                            <span className="text-xs text-gray-400">{tx.vpa}</span>
                                        )}
                                    </div>
                                </td>

                                <td data-test-id="status" className="px-6 py-4">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                                        tx.status === 'success' ? 'bg-green-100 text-green-700' : 
                                        tx.status === 'processing' ? 'bg-blue-100 text-blue-700' : 
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {tx.status}
                                    </span>
                                </td>
                                <td data-test-id="created-at" className="px-6 py-4 text-sm text-gray-600">{formatDate(tx.created_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {filteredTransactions.length === 0 && !loading && (
                    <div className="p-10 text-center text-gray-400">
                        <p>No transactions found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Transactions;