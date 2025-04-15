const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator'); // Import param

// Import Certificate Controller
const certificateController = require('../controllers/certificate.controller');

// Import Middleware
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validationMiddleware = require('../middleware/validation.middleware'); // Import validation handler

// --- Certificate Routes ---

// POST /api/certificates - Issue a new medical certificate
router.post('/',
    authMiddleware.authenticateToken,
    roleMiddleware.isDoctor,
    [
        // Validate required fields
        body('applicant_first_name').trim().notEmpty().withMessage('Applicant first name is required.'),
        body('applicant_last_name').trim().notEmpty().withMessage('Applicant last name is required.'),
        body('applicant_dob').isISO8601().toDate().withMessage('Valid applicant date of birth is required (YYYY-MM-DD).'),
        body('applicant_address').trim().notEmpty().withMessage('Applicant address is required.'),
        body('medical_findings').trim().notEmpty().withMessage('Medical findings are required.'),
        body('is_fit').isBoolean().withMessage('Fit status (is_fit) must be a boolean.'),
        // Optional field validation
        body('expiry_date').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Invalid expiry date format (YYYY-MM-DD).')
    ],
    validationMiddleware.handleValidationErrors, // Handle validation results
    certificateController.issueCertificate
);

// GET /api/certificates/:id - Get specific certificate details
router.get('/:id',
    authMiddleware.authenticateToken,
    roleMiddleware.checkRole(['doctor', 'dgtt_staff', 'dgtt_admin']),
    [
        param('id').isInt({ gt: 0 }).withMessage('Certificate ID must be a positive integer.')
    ],
    validationMiddleware.handleValidationErrors,
    certificateController.getCertificateDetails
);

// GET /api/certificates - Lister les certificats du docteur connecté (à implémenter)
router.get('/',
    authMiddleware.authenticateToken,
    roleMiddleware.isDoctor,
    certificateController.listDoctorCertificates
);

// Note: Certificate history for doctors is likely in doctor.routes.js
// Note: Verification via QR code is in verification.routes.js

// Remove placeholder route
// router.get('/ping', (req, res) => res.send('Certificate routes working!'));

module.exports = router; 