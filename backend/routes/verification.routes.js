const express = require('express');
const router = express.Router();
const { param } = require('express-validator'); // Import param

// Import Verification Controller
const verificationController = require('../controllers/verification.controller');
const validationMiddleware = require('../middleware/validation.middleware'); // Import validation handler

// --- Certificate Verification Route ---

// GET /api/verify/:qrIdentifier - Verify a certificate using its unique QR identifier
// This route might be public or require DGTT staff authentication depending on policy
router.get('/:qrIdentifier',
    [param('qrIdentifier').isUUID(4).withMessage('QR Identifier must be a valid UUID version 4.')],
    validationMiddleware.handleValidationErrors,
    /* Optional: Add auth middleware if needed */
    verificationController.verifyCertificateByQr
);

module.exports = router; 