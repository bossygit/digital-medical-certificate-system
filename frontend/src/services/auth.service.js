import apiClient from './api'; // Import the configured axios instance

const login = async (email, password) => {
    try {
        const response = await apiClient.post('/auth/login', { email, password });
        // The backend sends back { message, token, user: { id, email, role, firstName, lastName } }
        return response.data;
    } catch (error) {
        // Axios wraps errors, the actual response error is in error.response
        console.error('Login API error:', error.response ? error.response.data : error.message);
        // Re-throw a simplified error message or the response data for the component to handle
        throw new Error(error.response?.data?.message || 'Login failed. Please try again.');
    }
};

/**
 * Handles the first login process for doctors.
 * @param {string} email 
 * @param {string} tempPassword 
 * @param {string} newPassword 
 * @returns {Promise<object>} - The response data (user info and JWT token on success).
 */
const firstLogin = async (email, tempPassword, newPassword) => {
    try {
        const response = await apiClient.post('/auth/first-login', { email, tempPassword, newPassword });
        // Backend sends back { message, token, user } on success
        return response.data;
    } catch (error) {
        console.error('First Login API error:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'First login failed. Please try again.');
    }
};

/**
 * Requests a password reset email for the given email.
 * @param {string} email 
 * @returns {Promise<object>} - The response data (usually just a success message).
 */
const requestPasswordReset = async (email) => {
    try {
        const response = await apiClient.post('/auth/request-password-reset', { email });
        return response.data; // { message: "..." }
    } catch (error) {
        console.error('Request Password Reset API error:', error.response ? error.response.data : error.message);
        // Even on error, we might want to inform the user to check their email to avoid user enumeration
        // However, for UX, showing a generic failure might be better if the API truly failed (500).
        throw new Error(error.response?.data?.message || 'Failed to request password reset.');
    }
};

/**
 * Resets the password using a token.
 * @param {string} token - The password reset token from the email link.
 * @param {string} newPassword 
 * @returns {Promise<object>} - The response data (usually a success message).
 */
const resetPassword = async (token, newPassword) => {
    try {
        const response = await apiClient.post('/auth/reset-password', { token, newPassword });
        return response.data; // { message: "..." }
    } catch (error) {
        console.error('Reset Password API error:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to reset password.');
    }
};

// TODO: Add function for changePassword

const authService = {
    login,
    firstLogin,
    requestPasswordReset,
    resetPassword,
    // other auth functions...
};

export default authService; 