

export const UnsupportedPage = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4 bg-white">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-2">
                <img src={chrome.runtime.getURL("icons/icon128.png")} alt="Mia" className="w-10 h-10 brightness-0 invert" style={{ filter: 'brightness(0) invert(0)' }} />
            </div>

            <h2 className="text-xl font-bold text-gray-900">Mia is ready!</h2>

            <p className="text-gray-600 text-sm leading-relaxed">
                Mia works on <b>Google Meet</b>, <b>Zoom</b>, <b>Teams</b>, and <b>Webex</b>.
            </p>

            <p className="text-gray-500 text-xs">
                Join a meeting on one of these platforms to start getting real-time transcripts and insights.
            </p>

            <a
                href="https://console.getmia.live"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm w-full transition-colors flex items-center justify-center gap-2"
            >
                Open Dashboard
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            </a>
        </div>
    );
};
