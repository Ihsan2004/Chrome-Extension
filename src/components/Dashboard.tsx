import React, { useEffect, useState } from 'react';
import { storage } from '../utils/storage';
import { MeetingList } from './MeetingList';

interface DashboardProps {
    onLogout: () => void;
    isMeetingPage?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, isMeetingPage }) => {
    const [user, setUser] = useState<any>(null);
    const [note, setNote] = useState('');
    const [saveStatus, setSaveStatus] = useState('');

    useEffect(() => {
        const loadUser = async () => {
            const userData = await storage.get('user');
            setUser(userData);
        };
        loadUser();

        // Load partial note
        storage.get('quick_note').then(n => n && setNote(n));
    }, []);

    const handleLogout = async () => {
        await storage.remove('access_token');
        await storage.remove('user');
        onLogout();
    };

    const saveNote = async () => {
        if (!note.trim()) return;
        setSaveStatus('Saving...');
        // Here we would ideally sync to backend, for now local storage
        await storage.set('quick_note', note);
        setTimeout(() => setSaveStatus('Saved!'), 500);
        setTimeout(() => setSaveStatus(''), 2000);
    };

    return (
        <div style={{ width: '100%', minHeight: '100%', background: '#f8f7ff', fontFamily: 'system-ui, -apple-system, sans-serif' }} className="flex flex-col h-full">
            {/* Header */}
            <header style={{ background: '#ffffff', borderBottom: '2px solid #e0d4fc', padding: '16px' }} className="flex-shrink-0">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <div style={{ width: '32px', height: '32px', background: '#7c3aed', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={chrome.runtime.getURL("icons/icon128.png")} style={{ width: '20px', height: '20px', filter: 'brightness(0) invert(1)' }} alt="Mia" />
                        </div>
                        <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#7c3aed', letterSpacing: '-0.5px' }}>mia</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{ padding: '6px', color: '#9ca3af', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        title="Logout"
                    >
                        <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>

                <div className="flex justify-between items-end">
                    <div>
                        <p style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Welcome back</p>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{user?.email || 'Loading...'}</p>
                    </div>
                    {isMeetingPage && (
                        <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                            Active
                        </span>
                    )}
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Search / Action Bar */}
                <div className="grid grid-cols-2 gap-3">
                    <a href="https://console.getmia.live/meetings" target="_blank" className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-2 group text-decoration-none">
                        <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <span className="text-xs font-bold text-gray-600">Search</span>
                    </a>
                    <a href="https://console.getmia.live" target="_blank" className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-2 group text-decoration-none">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                        <span className="text-xs font-bold text-gray-600">History</span>
                    </a>
                </div>

                {/* Quick Note */}
                <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quick Note</h3>
                        <span className="text-[10px] text-green-500 font-medium">{saveStatus}</span>
                    </div>
                    <textarea
                        className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                        rows={3}
                        placeholder="Jot down a thought..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onBlur={saveNote}
                    ></textarea>
                </div>

                {/* Upcoming Meetings */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <svg style={{ width: '18px', height: '18px', color: '#7c3aed' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#1f2937' }}>Upcoming Meetings</h3>
                    </div>
                    <MeetingList />
                </div>
            </div>
        </div>
    );
};
