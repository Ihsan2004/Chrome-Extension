export const storage = {
    get: async (key: string): Promise<any> => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return new Promise((resolve) => {
                chrome.storage.local.get([key], (result) => {
                    resolve(result[key]);
                });
            });
        } else {
            // Fallback for local dev
            const value = localStorage.getItem(key);
            try {
                return value ? JSON.parse(value) : null;
            } catch (e) {
                return value;
            }
        }
    },
    set: async (key: string, value: any): Promise<void> => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return new Promise((resolve) => {
                chrome.storage.local.set({ [key]: value }, resolve);
            });
        } else {
            // Fallback for local dev
            localStorage.setItem(key, JSON.stringify(value));
        }
    },
    remove: async (key: string): Promise<void> => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return new Promise((resolve) => {
                chrome.storage.local.remove(key, resolve);
            });
        } else {
            // Fallback for local dev
            localStorage.removeItem(key);
        }
    }
};
