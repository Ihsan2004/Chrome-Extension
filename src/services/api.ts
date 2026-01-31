import { storage } from '../utils/storage';

const API_BASE_URL = 'https://console.getmia.live/api';

const sendToBackground = async (endpoint: string, method: string, body?: any, customHeaders: any = {}) => {
    const token = await storage.get('access_token');
    const headers: any = {
        'Content-Type': 'application/json',
        ...customHeaders
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = `${API_BASE_URL}${endpoint}`;

    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            action: 'API_REQUEST',
            data: {
                endpoint: fullUrl,
                method,
                body,
                headers
            }
        }, (response) => {
            if (chrome.runtime.lastError) {
                return reject(new Error(chrome.runtime.lastError.message));
            }
            if (!response) {
                return reject(new Error('No response from background script'));
            }
            if (response.success) {
                resolve(response.data);
            } else {
                reject(new Error(response.error || 'API Request Failed'));
            }
        });
    });
};

export const api = {
    post: async (endpoint: string, body: any): Promise<any> => {
        return sendToBackground(endpoint, 'POST', body);
    },

    get: async (endpoint: string, customHeaders: HeadersInit = {}): Promise<any> => {
        try {
            return await sendToBackground(endpoint, 'GET', undefined, customHeaders);
        } catch (error: any) {
            // Handle token expiry if possible, though background script usually handles the raw fetch
            // logic can be improved here if needed
            throw error;
        }
    },

    delete: async (endpoint: string): Promise<any> => {
        return sendToBackground(endpoint, 'DELETE');
    }
};
