import axios from 'axios';

// Determine the base URL for the API based on the environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
// Defaulting to localhost:5000/api (our backend default port)
// Use .env file in frontend root for REACT_APP_API_URL=http://your.api.domain/api in production

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Optional: Interceptor to add JWT token to requests
apiClient.interceptors.request.use(
    (config) => {
        // Retrieve the token from local storage (or context/state management)
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Optional: Interceptor to handle responses (e.g., logout on 401)
apiClient.interceptors.response.use(
    (response) => {
        // Any status code that lie within the range of 2xx cause this function to trigger
        return response;
    },
    (error) => {
        // Any status codes that falls outside the range of 2xx cause this function to trigger
        if (error.response && error.response.status === 401) {
            // Handle unauthorized access (e.g., token expired)
            console.error('Unauthorized access - logging out.');
            // Clear token and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Maybe clear user context here too
            // Redirect to login page (use window.location or react-router history)
            if (window.location.pathname !== '/login') { // Avoid redirect loop
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);


export default apiClient; 