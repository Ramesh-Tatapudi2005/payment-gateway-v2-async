import React, { useState } from 'react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
    e.preventDefault();
    // Simulate authentication by saving a token/flag
    localStorage.setItem('isAuthenticated', 'true'); 
    localStorage.setItem('merchantEmail', email); // Use test@example.com
    window.location.href = '/dashboard';
};

    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            {/* MANDATORY: data-test-id="login-form" */}
            <form 
                data-test-id="login-form" 
                onSubmit={handleLogin} 
                className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Merchant Login</h2>
                    <p className="text-gray-500 mt-2">Access your payment gateway dashboard</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Email Address</label>
                        {/* MANDATORY: data-test-id="email-input" */}
                        <input 
                            data-test-id="email-input"
                            type="email" 
                            placeholder="test@example.com" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Password</label>
                        {/* MANDATORY: data-test-id="password-input" */}
                        <input 
                            data-test-id="password-input"
                            type="password" 
                            placeholder="••••••••" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                    </div>

                    {/* MANDATORY: data-test-id="login-button" */}
                    <button 
                        data-test-id="login-button"
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
                    >
                        Sign In
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-50 text-center">
                    <p className="text-sm text-gray-400">
                        Use pre-seeded credentials for testing
                    </p>
                </div>
            </form>
        </div>
    );
};

export default Login;