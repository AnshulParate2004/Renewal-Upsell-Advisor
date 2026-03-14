// Use relative path so Vite proxy (dev) works: app on :8080 -> /api -> backend :8000. Set VITE_API_URL for full URL.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    try {
        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            let errorMsg = response.statusText;
            try {
                const text = await response.text();
                const errData = JSON.parse(text);
                if (errData && errData.detail) {
                    errorMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
                } else if (errData && errData.error) {
                    errorMsg = typeof errData.error === 'string' ? errData.error : JSON.stringify(errData.error);
                } else if (text) {
                    errorMsg = text;
                }
            } catch (e) {
                // Ignore parsing error, keep statusText
            }
            console.error(`API Error for ${endpoint}: ${response.status} ${errorMsg}`);
            throw new Error(`${errorMsg}`);
        }

        const text = await response.text();
        return text ? JSON.parse(text) : null;
    } catch (error) {
        console.error(`Fetch API failed for ${endpoint}:`, error);
        throw error;
    }
};
