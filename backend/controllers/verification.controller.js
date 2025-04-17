const db = require('../models');
const crypto = require('crypto');
const { validate: uuidValidate } = require('uuid'); // Import UUID validation function

// Verify certificate by QR identifier and check digital signature
exports.verifyCertificateByQr = async (req, res) => {
    const qrIdentifier = req.params.qrIdentifier;

    // 1. Validate qrIdentifier format
    if (!uuidValidate(qrIdentifier)) {
        return res.status(400).json({ message: 'Invalid QR identifier format.' });
    }

    try {
        // 2. Find certificate by QR identifier, include Doctor and User info
        const certificate = await db.Certificate.findOne({
            where: { qr_code_identifier: qrIdentifier },
            include: [
                {
                    model: db.Doctor,
                    as: 'issuingDoctor',
                    include: [
                        {
                            model: db.User,
                            as: 'user',
                            attributes: ['first_name', 'last_name'] // Only select necessary fields
                        }
                    ]
                }
            ]
        });

        // 3. If not found
        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found.', isValid: false });
        }

        // 4. Reconstruct the signed data string using concatenation (must match issuance)
        const dataToVerify = [
            certificate.applicant_first_name,
            certificate.applicant_last_name,
            certificate.applicant_dob, // Assumed 'YYYY-MM-DD' string from DB
            String(certificate.is_fit), // Explicit string conversion
            certificate.qr_code_identifier
        ].join('|'); // Use the SAME delimiter

        // 5. Calculate the hash of the reconstructed data
        const calculatedSignature = crypto.createHash('sha256').update(dataToVerify).digest('hex');

        // 6. Compare calculated hash with the stored digital signature
        if (calculatedSignature !== certificate.digital_signature) {
            console.warn(`Signature mismatch for QR ID: ${qrIdentifier}. Stored: ${certificate.digital_signature}, Calculated: ${calculatedSignature}`);
            return res.status(400).json({ message: 'Certificate verification failed: Data may have been tampered with.', isValid: false });
        }

        // 7. If signatures match, return relevant public certificate data
        // Determine the exact fields to return based on privacy requirements
        const doctorInfo = certificate.issuingDoctor?.user;
        const doctorName = doctorInfo ? `${doctorInfo.first_name} ${doctorInfo.last_name}` : 'N/A';

        res.status(200).json({
            message: 'Certificate verified successfully.',
            isValid: true,
            certificate: {
                applicantFirstName: certificate.applicant_first_name,
                applicantLastName: certificate.applicant_last_name,
                applicantDob: certificate.applicant_dob,
                isFit: certificate.is_fit,
                issueDate: certificate.issue_date,
                status: certificate.status,
                doctorName: doctorName
                // Potentially add expiry_date if relevant
            }
        });

    } catch (error) {
        console.error('Error verifying certificate by QR:', error);
        res.status(500).json({ message: 'An error occurred during certificate verification.', isValid: false });
    }
}; 