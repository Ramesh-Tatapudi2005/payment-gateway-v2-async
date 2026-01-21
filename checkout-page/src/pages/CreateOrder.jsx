import React, { useState } from 'react';
import axios from 'axios';

const CreateOrder = () => {
    const [amount, setAmount] = useState(''); // In INR
    const [receipt, setReceipt] = useState('');
    const [createdOrder, setCreatedOrder] = useState(null);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8000/api/v1/orders', {
                amount: parseInt(amount) * 100, // Convert to paise
                currency: "INR",
                receipt: receipt
            }, {
                headers: {
                    'X-Api-Key': 'key_test_abc123',
                    'X-Api-Secret': 'secret_test_xyz789'
                }
            });
            setCreatedOrder(response.data);
        } catch (err) {
            alert("Error creating order. Check console.");
        }
    };

    return (
        <div className="p-6 max-w-lg mx-auto bg-white rounded shadow-md">
            <h2 className="text-xl font-bold mb-4">Create New Payment Order</h2>
            <form onSubmit={handleCreate} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Amount (INR)</label>
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 500"
                        className="w-full p-2 border rounded"
                        required 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Receipt/Reference</label>
                    <input 
                        type="text" 
                        value={receipt} 
                        onChange={(e) => setReceipt(e.target.value)}
                        placeholder="Order #123"
                        className="w-full p-2 border rounded"
                    />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                    Generate Order
                </button>
            </form>

            {createdOrder && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
                    <p className="text-green-700 font-bold">Order Created Successfully!</p>
                    <p className="text-sm mt-2">Order ID: <code>{createdOrder.id}</code></p>
                    <a 
                        href={`http://localhost:3001/checkout?order_id=${createdOrder.id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="block mt-4 text-center bg-green-600 text-white p-2 rounded"
                    >
                        Go to Checkout Page
                    </a>
                </div>
            )}
        </div>
    );
};

export default CreateOrder;