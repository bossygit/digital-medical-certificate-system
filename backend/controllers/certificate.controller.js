const db = require('../models');
const qrcode = require('qrcode'); // For generating QR codes
const crypto = require('crypto'); // For digital signature hash
const { v4: uuidv4 } = require('uuid'); // Import UUID generator
const auditService = require('../services/audit.service'); // Import audit service

// Issue a new certificate
exports.issueCertificate = async (req, res) => {
    const doctorId = req.user.id; // From authenticateToken middleware
    const {
        applicant_first_name,
        applicant_last_name,
        applicant_dob,
        applicant_address,
        // issue_date is set by default in DB
        expiry_date, // Optional
        medical_findings,
        is_fit,
        // status is set by default in DB
    } = req.body;

    // 1. Basic Input Validation (More robust validation recommended with express-validator)
    if (!applicant_first_name || !applicant_last_name || !applicant_dob || !applicant_address || !medical_findings || is_fit === undefined || is_fit === null) {
        return res.status(400).json({ message: 'Missing required certificate fields.' });
    }
    if (typeof is_fit !== 'boolean') {
        return res.status(400).json({ message: 'Invalid format for \'is_fit\' field (must be boolean).' });
    }
    // Add more specific validation (date format for dob, etc.) as needed

    try {
        // 2. Prepare data for saving
        const qr_code_identifier = uuidv4(); // Generate unique identifier for QR code
        const issue_date = new Date(); // Capture issue date for signature

        // 3. Define data for digital signature and calculate hash
        const dataToSign = JSON.stringify({
            fn: applicant_first_name,
            ln: applicant_last_name,
            dob: applicant_dob,
            fit: is_fit,
            iss: issue_date.toISOString(), // Use ISO string for consistency
            qrId: qr_code_identifier
        });

        const digital_signature = crypto.createHash('sha256').update(dataToSign).digest('hex');

        // 4. Create certificate in database
        const newCertificate = await db.Certificate.create({
            doctor_id: doctorId,
            applicant_first_name,
            applicant_last_name,
            applicant_dob,
            applicant_address,
            issue_date, // Set issue date explicitly
            expiry_date: expiry_date || null, // Handle optional expiry date
            medical_findings,
            is_fit,
            qr_code_identifier,
            digital_signature,
            status: 'issued' // Explicitly set status
        });

        // ---> Log successful certificate issuance <---
        await auditService.logAction({
            userId: doctorId,
            action: 'certificate_issued',
            ipAddress: req.ip,
            targetType: 'certificate',
            targetId: newCertificate.certificate_id,
            details: {
                applicant: `${applicant_first_name} ${applicant_last_name}`,
                qrIdentifier: newCertificate.qr_code_identifier
            }
        });

        // 5. Return success response
        res.status(201).json({
            message: 'Certificate issued successfully.',
            certificateId: newCertificate.certificate_id,
            qrIdentifier: newCertificate.qr_code_identifier
        });

    } catch (error) {
        console.error('Error issuing certificate:', error);
        // ---> Log failed certificate issuance attempt (Optional) <---
        // await auditService.logAction({
        //     userId: doctorId,
        //     action: 'certificate_issue_failed',
        //     ipAddress: req.ip,
        //     details: { reason: error.message, applicantAttempted: `${applicant_first_name} ${applicant_last_name}` }
        // });
        // Check for specific Sequelize validation errors if needed
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Validation error', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'An error occurred while issuing the certificate.' });
    }
};

// Get details of a specific certificate
exports.getCertificateDetails = async (req, res) => {
    const certificateId = parseInt(req.params.id); // Already validated as int > 0
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;

    try {
        const certificate = await db.Certificate.findByPk(certificateId, {
            include: [
                {
                    model: db.Doctor,
                    as: 'issuingDoctor',
                    include: [
                        {
                            model: db.User,
                            as: 'user',
                            attributes: ['user_id', 'first_name', 'last_name', 'email'] // Include necessary doctor user details
                        }
                    ]
                }
            ]
        });

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found.' });
        }

        // Check permissions
        let isAllowed = false;
        if (requestingUserRole === 'doctor' && certificate.doctor_id === requestingUserId) {
            isAllowed = true; // Doctor can view their own issued certificates
        }
        if (requestingUserRole === 'dgtt_staff' || requestingUserRole === 'dgtt_admin') {
            isAllowed = true; // DGTT staff/admin can view any certificate
        }

        if (!isAllowed) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to view this certificate.' });
        }

        // Log action
        await auditService.logAction({
            userId: requestingUserId,
            action: 'get_certificate_details',
            ipAddress: req.ip,
            targetType: 'certificate',
            targetId: certificateId
        });

        // Return the full certificate details (or select specific fields if needed)
        res.status(200).json(certificate);

    } catch (error) {
        console.error('Error fetching certificate details:', error);
        res.status(500).json({ message: 'An error occurred while fetching certificate details.' });
    }
}; 