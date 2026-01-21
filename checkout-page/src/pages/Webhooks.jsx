import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Webhooks = () => {
    const [logs, setLogs] = useState([]);
    const [url, setUrl] = useState('');
    const [secret] = useState('whsec_test_abc123');

    // Requirement: Must match the credentials seeded in main.py
    const authHeaders = {
        'x-api-key': 'key_test_abc123',
        'x-api-secret': 'secret_test_xyz789'
    };

    useEffect(() => {
        // Authenticated request to fetch logs
        axios.get('http://localhost:8000/api/v1/payments/webhooks?limit=10', { headers: authHeaders })
            .then(res => setLogs(res.data.data))
            .catch(err => console.error("Error fetching logs:", err));
    }, []);

    // NEW: Function to save configuration to the backend
    const handleSave = () => {
        if (!url) return alert("Please enter a valid URL");
        
        axios.patch('http://localhost:8000/api/v1/test/merchant', 
            { webhook_url: url }, 
            { headers: authHeaders }
        )
        .then(() => alert("Webhook URL updated successfully!"))
        .catch(err => {
            console.error("Save error:", err);
            alert("Failed to save configuration.");
        });
    };

    const handleRetry = (webhookId) => {
        // Authenticated POST request to trigger manual retry
        axios.post(`http://localhost:8000/api/v1/payments/webhooks/${webhookId}/retry`, {}, { headers: authHeaders })
            .then(() => alert("Retry scheduled"))
            .catch(err => alert("Retry failed"));
    };

    return (
        <div className="p-6" data-test-id="webhook-config">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Webhook Configuration</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-8">
                <form data-test-id="webhook-config-form" className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Webhook URL</label>
                        <input 
                            data-test-id="webhook-url-input"
                            type="url" 
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            value={url} 
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="http://host.docker.internal:3002/api/webhooks"
                        />
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className="font-medium">Secret:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-blue-600 font-mono" data-test-id="webhook-secret">{secret}</code>
                    </div>
                    <button 
                        data-test-id="save-webhook-button"
                        type="button"
                        onClick={handleSave}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                        Save Configuration
                    </button>
                </form>
            </div>

            <h3 className="text-xl font-bold mb-4 text-gray-800">Webhook Logs</h3>
            <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
                <table className="w-full text-left" data-test-id="webhook-logs-table">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Event</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                            <th className="p-4 font-semibold text-gray-600">Attempts</th>
                            <th className="p-4 font-semibold text-gray-600">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs && logs.length > 0 ? logs.map(log => (
                            <tr key={log.id} data-test-id="webhook-log-item">
                                <td className="p-4 font-medium text-gray-700" data-test-id="webhook-event">{log.event}</td>
                                <td className="p-4" data-test-id="webhook-status">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {log.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-600" data-test-id="webhook-attempts">{log.attempts}</td>
                                <td className="p-4">
                                    <button 
                                        data-test-id="retry-webhook-button"
                                        onClick={() => handleRetry(log.id)}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold underline"
                                    >
                                        Retry
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-400 italic">No logs available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Webhooks;