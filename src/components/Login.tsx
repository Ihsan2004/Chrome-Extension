import React, { useState } from 'react';
import { api } from '../services/api';
import { storage } from '../utils/storage';

interface LoginProps {
    onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/auth/signin', { email, password });

            // Save token and user info
            await storage.set('access_token', response.access_token);
            await storage.set('user', response.user);

            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Get Auth URL
            const response = await api.get('/auth/google?mode=login');
            // Fix: ensure we access properties safely, though api.get returns any now
            const auth_url = response.auth_url;
            const initialState = response.state;

            // 2. Delegate Popup Opening to Background Script
            const authResult: any = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    action: 'GOOGLE_AUTH_START',
                    authUrl: auth_url
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        // Often happens if background script is reloading or channel closed
                        return reject(new Error(chrome.runtime.lastError.message));
                    }
                    if (!response) {
                        return reject(new Error('No response from auth handler'));
                    }
                    if (response.success) {
                        resolve(response);
                    } else {
                        reject(new Error(response.error || 'Google Auth Failed'));
                    }
                });
            });

            // 3. Exchange code for token (this happens back here in content script via proxy)
            const { code, state } = authResult;

            const tokenResponse = await api.get(`/auth/google/callback?code=${code}&state=${state}`, {
                'X-OAuth-State': initialState
            });

            await storage.set('access_token', tokenResponse.access_token);
            await storage.set('user', tokenResponse.user);

            onLoginSuccess();

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Google Login failed');
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] w-full bg-gray-50 font-sans p-6">
            <div className="w-full max-w-[320px]">
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                        <img src={chrome.runtime.getURL("icons/icon128.png")} className="w-7 h-7 filter brightness-0 invert" alt="Mia" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome Back</h2>
                    <p className="text-gray-500 text-sm mt-1">Sign in to Mia Assistant</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {error}
                    </div>
                )}

                {/* Google Button */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors duration-200 mb-4"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Sign in with Google</span>
                </button>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wider">
                        <span className="px-3 bg-gray-50 text-gray-500 font-medium">Or continue with email</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                            placeholder="name@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                            placeholder="Min. 8 characters"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full h-12 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] rounded-xl transition-colors duration-200 flex items-center justify-center ${loading ? 'opacity-80 cursor-wait' : ''}`}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <div className="text-center pt-2">
                        <a href="#" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Forgot password?</a>
                    </div>
                </form>
            </div>
        </div>
    );
};
