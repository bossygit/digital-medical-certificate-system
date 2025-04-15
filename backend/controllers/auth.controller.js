const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Doctor } = require('../models');

// Login controller
// backend/controllers/auth.controller.js
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.user_id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'VOTRE_CLE_SECRETE_PAR_DEFAUT_ICI',
            { expiresIn: process.env.JWT_EXPIRY || '24h' }
        );

        // Renvoyer l'objet user
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.user_id,
                email: user.email,
                role: user.role,
                firstName: user.first_name,
                lastName: user.last_name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Placeholder for other auth methods (implement these later)
exports.firstLogin = async (req, res) => {
    // Implement first login logic
    res.status(501).json({ message: 'Not implemented yet' });
};

exports.requestPasswordReset = async (req, res) => {
    // Implement password reset request logic
    res.status(501).json({ message: 'Not implemented yet' });
};

exports.resetPassword = async (req, res) => {
    // Implement password reset logic
    res.status(501).json({ message: 'Not implemented yet' });
};

exports.changePassword = async (req, res) => {
    // Implement change password logic
    res.status(501).json({ message: 'Not implemented yet' });
};

exports.logout = async (req, res) => {
    // JWT tokens are stateless, so we can't invalidate them server-side
    // The client should remove the token from storage
    res.json({ message: 'Logged out successfully' });
};
