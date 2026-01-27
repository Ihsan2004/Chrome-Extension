// This loader allows us to use ES Modules (Vite output) in content scripts
(async () => {
    console.log("Mia: Content Loader starting...");
    const src = chrome.runtime.getURL('assets/content.js');
    console.log("Mia: Importing content script from", src);
    try {
        await import(src);
        console.log("Mia: Content script imported successfully");
    } catch (e) {
        console.error("Mia: Failed to import content script", e);
    }
})();
