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
        <div className="w-[350px] min-h-[500px] bg-gray-50 text-gray-900 font-sans flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <img src={chrome.runtime.getURL("icons/icon128.png")} className="w-5 h-5 filter brightness-0 invert" alt="Mia" />
                        </div>
                        <h1 className="text-lg font-bold text-gray-900">Mia Assistant</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-gray-500 hover:text-red-500 transition-colors p-1"
                        title="Logout"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>

                <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Welcome Back</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900">Upcoming Meetings</h3>
                </div>

                <div className="space-y-3">
                    <MeetingList />
                </div>
            </div>
        </div>
    );
};
