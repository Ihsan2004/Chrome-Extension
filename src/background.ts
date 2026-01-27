// Background script to handle extension icon clicks and API proxying
chrome.action.onClicked.addListener((tab) => {
    console.log("Background: Icon clicked for tab", tab.id);
    if (tab.id) {
        // Send a message to the content script in the active tab
        chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_OVERLAY" })
            .then(() => {
                console.log("Background: Message sent successfully");
            })
            .catch((err) => {
                console.error("Background: Could not send message:", err);
            });
    }
});

// API Proxy Listener
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'API_REQUEST') {
        (async () => {
            try {
                const { endpoint, method, body, headers } = request.data;
                console.log(`Background: Proxying ${method} request to ${endpoint}`);

                const response = await fetch(endpoint, {
                    method,
                    headers,
                    body: body ? JSON.stringify(body) : undefined
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    sendResponse({ success: false, error: data.error || 'Request failed' });
                } else {
                    sendResponse({ success: true, data });
                }
            } catch (error: any) {
                console.error("Background: API Proxy Error:", error);
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true; // Keep channel open for async response
    }
    // Google Auth Listener
    if (request.action === 'GOOGLE_AUTH_START') {
        const { authUrl } = request;

        chrome.windows.create({
            url: authUrl,
            type: 'popup',
            width: 500,
            height: 600
        }, (windowInfo) => {
            if (!windowInfo || !windowInfo.id) {
                sendResponse({ success: false, error: 'Failed to open popup' });
                return;
            }

            const popupId = windowInfo.id;

            // Allow time for user to login
            const listener = (_tabId: number, changeInfo: any) => {
                if (changeInfo.url) {
                    if (changeInfo.url.includes('code=') && (changeInfo.url.includes('/auth/callback') || changeInfo.url.includes('getmia.live'))) {
                        try {
                            const url = new URL(changeInfo.url);
                            const code = url.searchParams.get('code');
                            const state = url.searchParams.get('state');

                            if (code) {
                                chrome.tabs.onUpdated.removeListener(listener);
                                chrome.windows.remove(popupId);
                                sendResponse({ success: true, code, state });
                            }
                        } catch (e: any) {
                            console.error("Url parse error", e);
                        }
                    }
                }
            };

            chrome.tabs.onUpdated.addListener(listener);

            // Clean up if closed manually
            chrome.windows.onRemoved.addListener((windowId) => {
                if (windowId === popupId) {
                    chrome.tabs.onUpdated.removeListener(listener);
                    // Use a timeout or check if we already responded to avoid double response logic error
                    // Actually, sendResponse can't be called twice, but messaging channel will close on its own.
                }
            });
        });

        return true; // Keep channel open
    }
});
