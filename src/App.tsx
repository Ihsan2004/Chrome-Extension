import { useEffect, useState } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { storage } from './utils/storage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isSupportedPage, setIsSupportedPage] = useState<boolean>(false);
  const [currentTabId, setCurrentTabId] = useState<number | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await storage.get('access_token');
      setIsAuthenticated(!!token);
    };
    checkAuth();

    // Check current tab to see if we should show "Toggle Overlay"
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        const url = tabs[0].url;
        setCurrentTabId(tabs[0].id || null);
        const isSupported =
          url.includes('meet.google.com') ||
          url.includes('zoom.us') ||
          url.includes('teams.microsoft.com') ||
          url.includes('webex.com') ||
          url.includes('getmia.live');

        setIsSupportedPage(isSupported);
      }
    });

  }, []);

  const toggleOverlay = () => {
    if (currentTabId) {
      chrome.tabs.sendMessage(currentTabId, { action: "TOGGLE_OVERLAY" });
      window.close();
    }
  };

  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center h-screen w-[350px]">Loading...</div>;
  }

  return (
    <div className="min-w-[350px] min-h-[500px] bg-gray-50 flex flex-col">
      {/* Helper Bar ONLY for Supported Pages */}
      {isSupportedPage && (
        <div className="bg-purple-600 text-white px-4 py-2 flex justify-between items-center text-xs font-medium shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>Meeting Active</span>
          </div>
          <button
            onClick={toggleOverlay}
            className="bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded text-white transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            Overlay Mode
          </button>
        </div>
      )}

      {isAuthenticated ? (
        <Dashboard
          onLogout={() => setIsAuthenticated(false)}
        // Pass this prop if Dashboard needs to know context, 
        // otherwise the new Dashboard handles generic state
        />
      ) : (
        <Login onLoginSuccess={() => setIsAuthenticated(true)} />
      )}
    </div>
  );
}

export default App;
