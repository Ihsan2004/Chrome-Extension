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
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group font-sans"
                    style={{ cursor: 'pointer' }}
                >
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="font-bold text-lg tracking-wide">Mia</span>
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
            className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 overflow-hidden"
        >
            {/* DRAG HANDLE - Dark Mode */}
            <div
                onMouseDown={handleMouseDown}
                className="handle bg-gray-900 p-3 cursor-move flex justify-between items-center border-b border-gray-800 select-none"
                style={{
                    cursor: 'grab',
                    backgroundColor: '#111827', // Tailwind gray-900
                    padding: '12px'
                }}
            >
                <div className="flex items-center gap-2">
                    <img src={chrome.runtime.getURL("icons/icon16.png")} alt="" className="w-4 h-4 opacity-80" />
                    <span className="font-semibold text-gray-300 text-sm">Mia Assistant</span>
                </div>
                <div className="flex items-center">
                    <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => setPersistedOpen(false)}
                        className="text-gray-500 hover:text-white px-2 font-bold text-lg transition-colors"
                        style={{ cursor: 'pointer' }}
                    >
                        &minus;
                    </button>
                </div>
            </div>

            {/* CONTENT - Dark Mode */}
            <div className="max-h-[80vh] overflow-y-auto bg-gray-900 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                {isAuthenticated ? (
                    <Dashboard onLogout={onLogout} />
                ) : (
                    <Login onLoginSuccess={onLoginSuccess} />
                )}
            </div>
        </div>
    );
};
