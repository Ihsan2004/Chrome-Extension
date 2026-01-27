import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OverlayApp } from './OverlayApp';
import './index.css';

console.log("Mia: Content script executing...");

const rootId = 'mia-extension-root';

if (!document.getElementById(rootId)) {
    const rootDiv = document.createElement('div');
    rootDiv.id = rootId;
    // Make the host take full viewport but not block interactions
    Object.assign(rootDiv.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '2147483647', // Max z-index
        pointerEvents: 'none'
    });
    document.body.appendChild(rootDiv);

    const shadowRoot = rootDiv.attachShadow({ mode: 'open' });
    const appRoot = document.createElement('div');
    // Allow pointer events on the React app container
    appRoot.style.pointerEvents = 'auto';
    shadowRoot.appendChild(appRoot);

    // Inject styles explicitly from the build output
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('assets/Dashboard.css');
    shadowRoot.appendChild(link);

    // Also support any dynamic styles if needed, but the main one is Dashboard.css

    createRoot(appRoot).render(
        <StrictMode>
            <OverlayApp />
        </StrictMode>
    );
}
