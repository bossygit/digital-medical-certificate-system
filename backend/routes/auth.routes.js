const express = require('express');
const router = express.Router();
const { body } = require('express-validator'); // Import body for validation

// Import Auth Controller
const authController = require('../controllers/auth.controller');

// Import Middleware
const authMiddleware = require('../middleware/auth.middleware');
const validationMiddleware = require('../middleware/validation.middleware'); // Import validation handler

// --- Authentication Routes ---

// POST /api/auth/login - User Login
router.post('/login',
    [
        body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
        body('password').notEmpty().withMessage('Password is required')
    ],
    validationMiddleware.handleValidationErrors, // Handle potential validation errors
    authController.login
);

// POST /api/auth/first-login - Doctor First Login
router.post('/first-login',
    [
        body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
        body('tempPassword').notEmpty().withMessage('Temporary password is required'),
        body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
    ],
    validationMiddleware.handleValidationErrors,
    authController.firstLogin
);

// POST /api/auth/request-password-reset
router.post('/request-password-reset',
    [
        body('email').isEmail().withMessage('Valid email is required').normalizeEmail()
    ],
    validationMiddleware.handleValidationErrors,
    authController.requestPasswordReset // Placeholder controller
);

// POST /api/auth/reset-password
router.post('/reset-password',
    [
        body('token').notEmpty().withMessage('Reset token is required'),
        body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
    ],
    validationMiddleware.handleValidationErrors,
    authController.resetPassword // Placeholder controller
);

// POST /api/auth/change-password
router.post('/change-password',
    authMiddleware.authenticateToken, // Authenticate first
    [
        body('currentPassword').notEmpty().withMessage('Current password is required'),
        body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
    ],
    validationMiddleware.handleValidationErrors,
    authController.changePassword // Placeholder controller
);

// POST /api/auth/logout
router.post('/logout',
    authMiddleware.authenticateToken,
    authController.logout
);

// Remove placeholder route if desired
// router.get('/ping', (req, res) => res.send('Auth routes working!'));

module.exports = router; 