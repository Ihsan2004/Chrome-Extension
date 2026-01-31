import React, { useState, useEffect, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { storage } from './utils/storage';

export const OverlayApp = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(false);

    // Position state
    const [position, setPosition] = useState({ x: window.innerWidth - 380, y: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Check auth on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = await storage.get('access_token');
            setIsAuthenticated(!!token);
        };
        checkAuth();

        // Load persisted open state
        storage.get('overlay_is_open').then((storedState) => {
            // Default to true if never set
            setIsOpen(storedState !== undefined ? storedState : true);
        });

        // Listen for storage changes (to sync across tabs in real-time)
        const handleStorageChange = (changes: any, areaName: string) => {
            if (areaName === 'local' && changes.overlay_is_open) {
                setIsOpen(changes.overlay_is_open.newValue);
            }
        };
        chrome.storage.onChanged.addListener(handleStorageChange);
        return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }, []);

    const onLoginSuccess = () => setIsAuthenticated(true);
    const onLogout = () => setIsAuthenticated(false);

    // Wrapper to update state and persistence
    const setPersistedOpen = (newState: boolean) => {
        setIsOpen(newState);
        storage.set('overlay_is_open', newState);
    };

    // Listen for toggle messages from background script
    useEffect(() => {
        const messageListener = (request: any, _sender: any, _sendResponse: any) => {
            if (request.action === 'TOGGLE_OVERLAY') {
                setPersistedOpen(!isOpen);
            }
        };
        chrome.runtime.onMessage.addListener(messageListener);
        return () => chrome.runtime.onMessage.removeListener(messageListener);
    }, [isOpen]);

    // Manual Drag Handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Only drag with left click on the handle
        if (e.button !== 0) return;

        const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setIsDragging(true);
        e.preventDefault();
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            // Constrain to window bounds (optional but good)
            const boundedX = Math.max(0, Math.min(newX, window.innerWidth - 350));
            const boundedY = Math.max(0, Math.min(newY, window.innerHeight - 100));

            setPosition({ x: boundedX, y: boundedY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    if (!isOpen) {
        return (
            <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 2147483647, pointerEvents: 'auto' }}>
                <button
                    onClick={() => setPersistedOpen(true)}
                    style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'linear-gradient(to right, #3b82f6, #9333ea)',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '9999px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        border: 'none',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <div style={{ width: '10px', height: '10px', background: 'white', borderRadius: '50%' }}></div>
                    <span style={{ fontWeight: 'bold', fontSize: '18px', letterSpacing: '0.025em' }}>Mia</span>
                </button>
            </div>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 99999,
                width: '350px',
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column'
            }}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
        >
            {/* DRAG HANDLE */}
            <div
                onMouseDown={handleMouseDown}
                className="handle bg-gradient-to-r from-blue-500 to-purple-600 p-3 cursor-move flex justify-between items-center select-none"
                style={{
                    cursor: 'grab'
                }}
            >
                <div className="flex items-center gap-2">
                    <img src={chrome.runtime.getURL("icons/icon16.png")} alt="" className="w-4 h-4 brightness-0 invert" />
                    <span className="font-semibold text-white text-sm tracking-wide">Mia Assistant</span>
                </div>
                <div className="flex items-center">
                    <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => setPersistedOpen(false)}
                        className="text-white/80 hover:text-white px-2 font-bold text-lg transition-colors"
                        style={{ cursor: 'pointer' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {isAuthenticated ? (
                    <Dashboard onLogout={onLogout} />
                ) : (
                    <Login onLoginSuccess={onLoginSuccess} />
                )}
            </div>
        </div>
    );
};
