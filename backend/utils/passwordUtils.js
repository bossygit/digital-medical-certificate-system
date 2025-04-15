const crypto = require('crypto');

/**
 * Generates a random temporary password.
 * @param {number} length The desired length of the password (default: 12)
 * @returns {string} A random alphanumeric string.
 */
function generateTemporaryPassword(length = 12) {
    // Characters to include in the password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let password = '';
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
        // Use modulo to map the random byte to an index in the chars string
        password += chars[randomBytes[i] % chars.length];
    }
    return password;
}

module.exports = {
    generateTemporaryPassword
};
