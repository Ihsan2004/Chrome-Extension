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
            const response = await api.get('/auth/google?mode=login');
            const auth_url = response.auth_url;
            const initialState = response.state;

            const authResult: any = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    action: 'GOOGLE_AUTH_START',
                    authUrl: auth_url
                }, (response) => {
                    if (chrome.runtime.lastError) {
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

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 16px',
        background: '#ffffff',
        border: '2px solid #d1d5db',
        borderRadius: '12px',
        color: '#111827',
        fontSize: '14px',
        fontWeight: 500,
        fontFamily: 'inherit',
        outline: 'none',
        boxSizing: 'border-box',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '550px', width: '100%', background: '#f8f7ff', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '24px', boxSizing: 'border-box' }}>
            <div style={{ width: '100%', maxWidth: '340px' }}>
                {/* Header */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '64px', height: '64px', background: '#7c3aed', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                        <img src={chrome.runtime.getURL("icons/icon128.png")} style={{ width: '36px', height: '36px', filter: 'brightness(0) invert(1)' }} alt="Mia" />
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#7c3aed', letterSpacing: '-0.5px' }}>Welcome Back</h2>
                    <p style={{ color: '#4b5563', fontSize: '14px', marginTop: '8px', fontWeight: 600 }}>Sign in to Mia Assistant</p>
                </div>

                {error && (
                    <div style={{ background: '#dc2626', border: '2px solid #b91c1c', color: '#fff', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg style={{ width: '18px', height: '18px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {error}
                    </div>
                )}

                {/* Google Button */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    style={{ width: '100%', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#fff', border: '2px solid #d1d5db', color: '#1f2937', fontWeight: 700, borderRadius: '12px', cursor: 'pointer', marginBottom: '16px', fontSize: '14px', fontFamily: 'inherit' }}
                >
                    <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Sign in with Google</span>
                </button>

                <div style={{ position: 'relative', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 1, height: '1px', background: '#d1d5db' }} />
                    <span style={{ padding: '0 12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', fontWeight: 600, background: '#f8f7ff' }}>Or continue with email</span>
                    <div style={{ flex: 1, height: '1px', background: '#d1d5db' }} />
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#1f2937', marginBottom: '8px' }}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={inputStyle}
                            placeholder="name@example.com"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#1f2937', marginBottom: '8px' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={inputStyle}
                            placeholder="Min. 8 characters"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            height: '48px',
                            marginTop: '8px',
                            background: '#7c3aed',
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: '15px',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: loading ? 'wait' : 'pointer',
                            opacity: loading ? 0.8 : 1,
                            fontFamily: 'inherit',
                        }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <div style={{ textAlign: 'center', paddingTop: '12px' }}>
                        <a href="#" style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', textDecoration: 'none' }}>Forgot password?</a>
                    </div>
                </form>
            </div>
        </div>
    );
};
