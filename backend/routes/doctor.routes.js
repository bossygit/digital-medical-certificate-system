const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator'); // Import body and query

// Import Doctor Controller
const doctorController = require('../controllers/doctor.controller');

// Import Middleware
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validationMiddleware = require('../middleware/validation.middleware'); // Import validation handler

// --- Apply Authentication and Role Middleware to all Doctor routes ---
router.use(authMiddleware.authenticateToken); // First, authenticate
router.use(roleMiddleware.isDoctor); // Then, check if user is a doctor

// --- Doctor Specific Routes ---

// GET /api/doctors/profile - Get Doctor's own profile
router.get('/profile', doctorController.getProfile);

// PUT /api/doctors/profile - Update Doctor's own profile
router.put('/profile',
    [
        // Validate fields that can be updated
        body('first_name').optional().trim().notEmpty().withMessage('First name cannot be empty.'),
        body('last_name').optional().trim().notEmpty().withMessage('Last name cannot be empty.'),
        body('phone_number').optional({ checkFalsy: true }).trim().isMobilePhone('any').withMessage('Invalid phone number format.'),
        body('specialty').optional().trim(),
        body('office_address').optional().trim(),
        // Ensure forbidden fields are not present
        body('email').not().exists().withMessage('Email cannot be updated via profile.'),
        body('role').not().exists().withMessage('Role cannot be updated.'),
        body('agrement_number').not().exists().withMessage('Agreement number cannot be updated via profile.')
    ],
    validationMiddleware.handleValidationErrors,
    doctorController.updateProfile
);

// GET /api/doctors/certificates - Get Doctor's certificate history with pagination
router.get('/certificates',
    [
        query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer.'),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100.')
    ],
    validationMiddleware.handleValidationErrors,
    doctorController.getCertificateHistory
);

// GET /api/doctors/carnet - Get Doctor's digital carnet summary
router.get('/carnet', doctorController.getCarnetSummary);

// Remove placeholder route
// router.get('/ping', (req, res) => res.send('Doctor routes working! (Requires Auth)'));

module.exports = router; 