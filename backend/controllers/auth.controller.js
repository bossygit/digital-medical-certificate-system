const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Doctor } = require('../models');
const { generateTemporaryPassword } = require('../utils/passwordUtils');

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
    const { email, tempPassword, newPassword } = req.body;

    try {
        // 1. Trouver l'utilisateur par email
        const user = await User.findOne({ where: { email } });

        // On cherche spécifiquement les docteurs pour cette route? Ouvert à tous ?
        // Pour l'instant, on suppose que c'est pour un utilisateur existant.
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // 2. Vérifier si le mot de passe temporaire correspond
        // NOTE: Ici on suppose que le mot de passe temporaire N'EST PAS le hash stocké.
        // Si addDoctor stocke le hash du mot de passe temporaire, il faut comparer avec bcrypt.compare.
        // Si addDoctor NE stocke PAS le mot de passe temporaire (juste le hash final),
        // cette route n'est pas utilisable telle quelle.
        //
        // --> HYPOTHESE : addDoctor stocke le HASH du mot de passe TEMPORAIRE.
        const isTempPasswordValid = await bcrypt.compare(tempPassword, user.password_hash);

        if (!isTempPasswordValid) {
            // On pourrait vouloir un message différent si le mot de passe est déjà changé
            return res.status(401).json({ message: 'Invalid temporary password or account already setup.' });
        }

        // 3. Hasher le nouveau mot de passe permanent
        const saltRounds = 10;
        const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // 4. Mettre à jour le mot de passe dans la base de données
        await User.update(
            { password_hash: newHashedPassword },
            { where: { user_id: user.user_id } }
        );

        // 5. Générer un nouveau token JWT pour la session
        const token = jwt.sign(
            { id: user.user_id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'VOTRE_CLE_SECRETE_PAR_DEFAUT_ICI',
            { expiresIn: process.env.JWT_EXPIRY || '24h' }
        );

        // TODO: Log l'action de première connexion
        await auditService.logAction({ userId: user.user_id, action: 'first_login_completed', ipAddress: req.ip });

        // 6. Renvoyer succès avec le nouveau token et les infos utilisateur
        res.json({
            message: 'Password updated successfully. You are now logged in.',
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
        console.error('First login error:', error);
        res.status(500).json({ message: 'Server error during first login process.' });
    }
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
