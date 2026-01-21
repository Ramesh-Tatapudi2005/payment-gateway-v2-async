import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Move static headers outside to resolve exhaustive-deps warning
const AUTH_HEADERS = {
    'x-api-key': 'key_test_abc123',
    'x-api-secret': 'secret_test_xyz789'
};

const Webhooks = () => {
    const [logs, setLogs] = useState([]);
    const [url, setUrl] = useState('');
    const [secret] = useState('whsec_test_abc123');
    const [isSaving, setIsSaving] = useState(false);

    // Stable fetch function
    const fetchLogs = useCallback(async () => {
        try {
            // Updated endpoint to match the payments router
            const res = await axios.get('http://localhost:8000/api/v1/payments/webhooks?limit=10', { 
                headers: AUTH_HEADERS 
            });
            setLogs(res.data.data);
        } catch (err) {
            console.error("Error fetching logs:", err);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleSaveConfig = async () => {
        if (!url) return alert("Please enter a valid URL");
        setIsSaving(true);
        try {
            // Task 7.1 Requirement: Persistent webhook configuration
            await axios.patch('http://localhost:8000/api/v1/merchants/me', 
                { webhook_url: url }, 
                { headers: AUTH_HEADERS }
            );
            alert("Webhook URL updated successfully!");
        } catch (err) {
            alert("Failed to save configuration. Ensure the URL is valid.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRetry = async (webhookId) => {
        try {
            // Task 7.1 Requirement: Manual retry functionality
            await axios.post(`http://localhost:8000/api/v1/payments/webhooks/${webhookId}/retry`, 
                {}, 
                { headers: AUTH_HEADERS }
            );
            alert("Retry job scheduled in background!");
            fetchLogs(); // Refresh status to 'pending'
        } catch (err) {
            alert("Retry request failed");
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8" data-test-id="webhook-config">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Webhook Settings</h1>
            
            {/* Configuration Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                <form data-test-id="webhook-config-form" className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Endpoint URL</label>
                        <input 
                            data-test-id="webhook-url-input"
                            type="url" 
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={url} 
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://your-api.com/webhooks"
                        />
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span className="font-bold text-gray-400">SIGNING SECRET:</span>
                        <code className="px-2 py-1 rounded text-blue-600 font-mono font-bold" data-test-id="webhook-secret">{secret}</code>
                    </div>
                    <button 
                        data-test-id="save-webhook-button"
                        type="button"
                        disabled={isSaving}
                        onClick={handleSaveConfig}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold disabled:bg-blue-300 shadow-sm"
                    >
                        {isSaving ? "Saving..." : "Save Configuration"}
                    </button>
                </form>
            </div>

            {/* Webhook Delivery Logs */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800">Delivery History</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left" data-test-id="webhook-logs-table">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Event Type</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase text-center">Attempts</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs && logs.length > 0 ? logs.map(log => (
                                <tr key={log.id} data-test-id="webhook-log-item" className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-mono text-sm font-bold text-blue-600" data-test-id="webhook-event">{log.event}</td>
                                    <td className="p-4" data-test-id="webhook-status">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black tracking-widest ${
                                            log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {log.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center font-bold text-gray-600" data-test-id="webhook-attempts">{log.attempts}</td>
                                    <td className="p-4 text-right">
                                        <button 
                                            data-test-id="retry-webhook-button"
                                            onClick={() => handleRetry(log.id)}
                                            className="text-blue-600 hover:text-blue-800 text-xs font-black uppercase tracking-tighter underline"
                                        >
                                            Manual Retry
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center text-gray-400 italic font-medium">No webhook delivery attempts yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Webhooks;