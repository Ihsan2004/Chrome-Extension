import { useEffect, useState } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { UnsupportedPage } from './components/UnsupportedPage';
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

    // Check current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        const url = tabs[0].url;
        setCurrentTabId(tabs[0].id || null);
        const isSupported =
          url.includes('meet.google.com') ||
          url.includes('zoom.us') ||
          url.includes('teams.microsoft.com') ||
          url.includes('webex.com') ||
          url.includes('getmia.live'); // Also support our own site

        setIsSupportedPage(isSupported);
      }
    });

  }, []);

  const toggleOverlay = () => {
    if (currentTabId) {
      chrome.tabs.sendMessage(currentTabId, { action: "TOGGLE_OVERLAY" });
      window.close(); // Close popup after action
    }
  };

  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center h-screen w-[350px]">Loading...</div>;
  }

  // If not on a supported page, show the "Home" state
  if (!isSupportedPage) {
    return (
      <div className="w-[350px] h-[450px]">
        <UnsupportedPage />
      </div>
    );
  }

  return (
    <div className="min-w-[350px] min-h-[450px] bg-gray-50 flex flex-col">
      {/* Helper Bar for Supported Pages */}
      <div className="bg-purple-600 text-white px-4 py-2 flex justify-between items-center text-xs font-medium">
        <span>Active on this page</span>
        <button
          onClick={toggleOverlay}
          className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
        >
          Toggle Overlay
        </button>
      </div>

      {isAuthenticated ? (
        <Dashboard onLogout={() => setIsAuthenticated(false)} />
      ) : (
        <Login onLoginSuccess={() => setIsAuthenticated(true)} />
      )}
    </div>
  );
}

export default App;
