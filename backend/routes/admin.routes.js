const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator'); // Import query

// Import Admin Controller
const adminController = require('../controllers/admin.controller');

// Import Middleware
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validationMiddleware = require('../middleware/validation.middleware'); // Import validation handler

// --- Apply Authentication and Admin Role Middleware to all Admin routes ---
router.use(authMiddleware.authenticateToken);
router.use(roleMiddleware.isDgttAdmin);

// Middleware placeholder for individual routes (no longer needed as it's applied globally for this file)
// const checkAdmin = (req, res, next) => { /* TODO: Implement Auth + Admin Role Check */ next(); };

// == Doctor Management ==
// GET /api/admin/doctors - List all doctors with pagination
router.get('/doctors',
    [
        query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer.'),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100.')
    ],
    validationMiddleware.handleValidationErrors,
    adminController.listDoctors
);

// POST /api/admin/doctors - Add a new doctor
router.post('/doctors',
    [
        body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
        body('first_name').trim().notEmpty().withMessage('First name is required.'),
        body('last_name').trim().notEmpty().withMessage('Last name is required.'),
        body('agrement_number').trim().notEmpty().withMessage('Agreement number is required.'),
        body('phone_number').optional({ checkFalsy: true }).trim().isMobilePhone('any').withMessage('Invalid phone number format.'), // Basic phone validation
        body('specialty').optional().trim(),
        body('office_address').optional().trim()
    ],
    validationMiddleware.handleValidationErrors,
    adminController.addDoctor
);

// GET /api/admin/doctors/:id - Get details of a specific doctor
router.get('/doctors/:id',
    [param('id').isInt({ gt: 0 }).withMessage('Doctor ID must be a positive integer.')],
    validationMiddleware.handleValidationErrors,
    adminController.getDoctorDetails
);

// PUT /api/admin/doctors/:id - Update doctor information
router.put('/doctors/:id',
    [
        param('id').isInt({ gt: 0 }).withMessage('Doctor ID must be a positive integer.'),
        // Add validation for fields that can be updated (e.g., names, phone, specialty, address)
        body('first_name').optional().trim().notEmpty(),
        body('last_name').optional().trim().notEmpty(),
        body('phone_number').optional({ checkFalsy: true }).trim().isMobilePhone('any'),
        // Prevent updating email or agrement_number via this route?
        body('email').not().exists().withMessage('Email cannot be updated here.'),
        body('agrement_number').not().exists().withMessage('Agreement number cannot be updated here.')
    ],
    validationMiddleware.handleValidationErrors,
    adminController.updateDoctor
);

// PATCH /api/admin/doctors/:id/status - Activate/Suspend a doctor account
router.patch('/doctors/:id/status',
    [
        param('id').isInt({ gt: 0 }).withMessage('Doctor ID must be a positive integer.'),
        body('isActive').isBoolean().withMessage('isActive must be a boolean.')
    ],
    validationMiddleware.handleValidationErrors,
    adminController.updateDoctorStatus
);

// == Statistics and Reports ==
// GET /api/admin/stats - Get Global System Statistics
router.get('/stats', adminController.getGlobalStats); // <<< Nouvelle route globale

// Garder ou supprimer l'ancienne route si l'endpoint global suffit
// router.get('/stats/certificates', adminController.getCertificateStats);

// == Notifications ==
// POST /api/admin/notifications/expiry - Trigger notifications for expiring certificates
router.post('/notifications/expiry', adminController.sendExpiryNotifications);

// == Certificate Management ==
// GET /api/admin/certificates - List all certificates (for Admin)
router.get('/certificates',
    [ // Validation optionnelle de la pagination
        query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer.'),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100.')
    ],
    validationMiddleware.handleValidationErrors,
    adminController.listAllCertificates // Nouvelle fonction contrôleur
);

// Remove placeholder route
// router.get('/ping', (req, res) => res.send('Admin routes working! (Requires Admin Auth)'));

module.exports = router; 