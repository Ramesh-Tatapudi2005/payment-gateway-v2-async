import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CreateOrder = () => {
    const [amount, setAmount] = useState('');
    const [receipt, setReceipt] = useState('');
    const [loading, setLoading] = useState(false);
    const [createdOrder, setCreatedOrder] = useState(null);
    const [copied, setCopied] = useState(false);

    // Auto-generate a unique receipt ID on component mount
    useEffect(() => {
        const uniqueId = `REC-${Date.now()}`;
        setReceipt(uniqueId);
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setCreatedOrder(null); 
        try {
            const response = await axios.post('http://localhost:8000/api/v1/orders', {
                amount: parseInt(amount) * 100, 
                currency: "INR",
                receipt: receipt,
                notes: { created_via: "Merchant Dashboard" }
            }, {
                headers: {
                    'X-Api-Key': 'key_test_abc123',
                    'X-Api-Secret': 'secret_test_xyz789'
                }
            });
            setCreatedOrder(response.data);
            
            // Generate a fresh unique ID for the next order automatically
            setReceipt(`REC-${Date.now()}`);
        } catch (err) {
            console.error(err);
            alert("Error creating order. Ensure Backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const checkoutUrl = createdOrder ? `http://localhost:3001/checkout?order_id=${createdOrder.id}` : '';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(checkoutUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
                <p className="text-gray-500 mt-1">Generate a secure payment link for your customers</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-fit">
                    <h2 className="text-lg font-bold mb-6 text-gray-800">Order Details</h2>
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Amount (INR)</label>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="500.00"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                required 
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Receipt Ref (Auto-generated)</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={receipt} 
                                    onChange={(e) => setReceipt(e.target.value)}
                                    placeholder="e.g. INV-101"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-400"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setReceipt(`REC-${Date.now()}`)}
                                    className="absolute right-3 top-2.5 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-600 transition"
                                    title="Regenerate unique ID"
                                >
                                    🔄 New
                                </button>
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-white transition ${loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {loading ? "Generating..." : "Generate Payment Order"}
                        </button>
                    </form>
                </div>

                <div className="flex flex-col">
                    {createdOrder ? (
                        <div className="bg-green-50 p-8 rounded-2xl border border-green-100 shadow-sm animate-in fade-in duration-500">
                            <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                                <span>✅</span> Order Created
                            </h3>
                            <div className="space-y-4 mb-6">
                                <div className="bg-white p-4 rounded-xl border border-green-100">
                                    <p className="text-[10px] font-bold text-green-600 uppercase mb-1">Receipt Number</p>
                                    <p className="text-xs font-mono text-gray-700 mb-3">{createdOrder.receipt}</p>
                                    <p className="text-[10px] font-bold text-green-600 uppercase mb-1">Payment URL</p>
                                    <p className="text-xs font-mono text-gray-500 truncate mb-3">{checkoutUrl}</p>
                                    <button 
                                        onClick={copyToClipboard}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-800"
                                    >
                                        {copied ? "✓ Copied to Clipboard!" : "Copy Payment Link"}
                                    </button>
                                </div>
                            </div>
                            <a 
                                href={checkoutUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition shadow-lg"
                            >
                                Open Hosted Checkout Page →
                            </a>
                        </div>
                    ) : (
                        <div className="h-full bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center text-gray-400">
                            <p className="text-5xl mb-4">🔗</p>
                            <p className="font-medium">The Hosted Checkout URL will appear here after you generate an order.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateOrder;