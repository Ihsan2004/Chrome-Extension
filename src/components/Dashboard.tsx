import React, { useEffect, useState } from 'react';
import { storage } from '../utils/storage';
import { MeetingList } from './MeetingList';

interface DashboardProps {
    onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const loadUser = async () => {
            const userData = await storage.get('user');
            setUser(userData);
        };
        loadUser();
    }, []);

    const handleLogout = async () => {
        await storage.remove('access_token');
        await storage.remove('user');
        onLogout();
    };

    return (
        <div style={{ width: '380px', minHeight: '550px', background: '#f8f7ff', fontFamily: 'system-ui, -apple-system, sans-serif' }} className="flex flex-col">
            {/* Header */}
            <header style={{ background: '#ffffff', borderBottom: '2px solid #e0d4fc', padding: '20px' }} className="flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div style={{ width: '40px', height: '40px', background: '#7c3aed', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={chrome.runtime.getURL("icons/icon128.png")} style={{ width: '24px', height: '24px', filter: 'brightness(0) invert(1)' }} alt="Mia" />
                        </div>
                        <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#7c3aed', letterSpacing: '-0.5px' }}>mia</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{ padding: '8px', color: '#6b7280', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        title="Logout"
                    >
                        <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>

                <div style={{ background: '#7c3aed', borderRadius: '12px', padding: '16px' }}>
                    <p style={{ fontSize: '11px', color: '#ddd6fe', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Welcome back</p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || 'Loading...'}</p>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto" style={{ padding: '20px' }}>
                <div className="flex items-center gap-2 mb-4">
                    <svg style={{ width: '20px', height: '20px', color: '#7c3aed' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#1f2937' }}>Upcoming Meetings</h3>
                </div>

                <MeetingList />
            </div>
        </div>
    );
};
