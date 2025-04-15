const db = require('../models');
const qrcode = require('qrcode'); // For generating QR codes
const crypto = require('crypto'); // For digital signature hash
const { v4: uuidv4 } = require('uuid'); // Import UUID generator
const auditService = require('../services/audit.service'); // Import audit service
const { Certificate, sequelize, Doctor } = require('../models');
const QRCode = require('qrcode'); // For generating QR codes

// Issue a new certificate
exports.issueCertificate = async (req, res) => {
    const doctorUserId = req.user.id; // ID de l'utilisateur connecté

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

    const transaction = await sequelize.transaction();

    try {
        // --- NOUVELLE ETAPE : Trouver l'ID du Docteur ---
        const doctorProfile = await Doctor.findOne({
            where: { user_id: doctorUserId }, // Trouvez le docteur par user_id
            attributes: ['doctor_id'], // Ne récupérez que l'ID docteur
            transaction
        });

        if (!doctorProfile) {
            await transaction.rollback();
            console.error("Doctor profile not found for user ID:", doctorUserId);
            return res.status(400).json({ message: "Doctor profile not found for the logged-in user." });
        }
        const actualDoctorId = doctorProfile.doctor_id; // <<< ID Correct de la table Doctors
        // --- FIN NOUVELLE ETAPE ---

        // 1. Basic Input Validation (More robust validation recommended with express-validator)
        if (!applicant_first_name || !applicant_last_name || !applicant_dob || !applicant_address || !medical_findings || is_fit === undefined || is_fit === null) {
            return res.status(400).json({ message: 'Missing required certificate fields.' });
        }
        if (typeof is_fit !== 'boolean') {
            return res.status(400).json({ message: 'Invalid format for \'is_fit\' field (must be boolean).' });
        }
        // Add more specific validation (date format for dob, etc.) as needed

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
        const newCertificate = await Certificate.create({
            doctor_id: actualDoctorId,
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
        }, { transaction });

        // ---> Log successful certificate issuance <---
        await auditService.logAction({
            userId: doctorUserId,
            action: 'certificate_issued',
            ipAddress: req.ip,
            targetType: 'certificate',
            targetId: newCertificate.certificate_id,
            details: {
                applicant: `${applicant_first_name} ${applicant_last_name}`,
                qrIdentifier: newCertificate.qr_code_identifier,
                doctorId: actualDoctorId
            }
        });

        // 5. Generate QR code data URL
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/verification/${qr_code_identifier}`; // Assurez-vous que qr_code_identifier est défini
        const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: 'H' });

        // --- AJOUTEZ LE COMMIT ICI ---
        await transaction.commit();
        console.log("Transaction committed successfully."); // Log de confirmation
        // --- FIN DE L'AJOUT ---

        // 7. Renvoyer les détails du certificat créé ET le QR code
        res.status(201).json({
            message: 'Certificate issued successfully.',
            certificate: {
                id: newCertificate.certificate_id,
                qrIdentifier: newCertificate.qr_code_identifier,
                applicantName: `${newCertificate.applicant_first_name} ${newCertificate.applicant_last_name}`,
                issueDate: newCertificate.issue_date,
                expiryDate: newCertificate.expiry_date,
                status: newCertificate.status,
                isFit: newCertificate.is_fit,
            },
            qrCodeDataURL: qrCodeDataURL
        });

    } catch (error) {
        // Le rollback est important ici en cas d'erreur
        if (transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
            await transaction.rollback();
            console.log("Transaction rolled back due to error.");
        }
        console.error('Error issuing certificate:', error);
        // ---> Log failed certificate issuance attempt (Optional) <---
        // await auditService.logAction({
        //     userId: doctorUserId,
        //     action: 'certificate_issue_failed',
        //     ipAddress: req.ip,
        //     details: { reason: error.message, applicantAttempted: `${applicant_first_name} ${applicant_last_name}` }
        // });
        // Check for specific Sequelize validation errors if needed
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Validation error', errors: error.errors.map(e => e.message) });
        }
        // Renvoyer l'erreur FK spécifique si elle se produit toujours (ne devrait pas)
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            console.error('FK Error Details:', error.parent?.sqlMessage); // Log spécifique
            return res.status(400).json({ message: 'Internal error linking doctor to certificate.' });
        }
        res.status(500).json({ message: 'An error occurred while issuing the certificate.' });
    }
};

// Get details of a specific certificate
exports.getCertificateDetails = async (req, res) => {
    const certificateId = parseInt(req.params.id);
    const requestingUserId = req.user.id; // <<< ID de l'utilisateur (table Users)
    const requestingUserRole = req.user.role;

    console.log(`--- Debug getCertificateDetails (Cert ID: ${certificateId}) ---`); // Log début
    console.log(`Requesting User ID (from token): ${requestingUserId}, Role: ${requestingUserRole}`);

    try {
        // Trouver le doctor_id de l'utilisateur connecté (si c'est un docteur)
        let loggedInDoctorId = null;
        if (requestingUserRole === 'doctor') {
            const doctorProfile = await db.Doctor.findOne({
                where: { user_id: requestingUserId },
                attributes: ['doctor_id']
            });
            if (doctorProfile) {
                loggedInDoctorId = doctorProfile.doctor_id;
                console.log(`Found Doctor ID for requesting user: ${loggedInDoctorId}`); // Log ID Docteur trouvé
            } else {
                console.warn(`Doctor profile not found for logged-in user ID: ${requestingUserId}`);
            }
        }

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
            console.log(`Certificate with ID ${certificateId} not found.`); // Log si non trouvé
            return res.status(404).json({ message: 'Certificate not found.' });
        }

        console.log(`Certificate's issuing Doctor ID (certificate.doctor_id): ${certificate.doctor_id}`); // Log ID Docteur du certificat

        // Check permissions
        let isAllowed = false;
        if (requestingUserRole === 'doctor' && loggedInDoctorId !== null && certificate.doctor_id === loggedInDoctorId) {
            isAllowed = true;
            console.log("Permission check passed: Requesting user is the issuing doctor."); // Log Succès
        }
        if (requestingUserRole === 'dgtt_staff' || requestingUserRole === 'dgtt_admin') {
            isAllowed = true;
            console.log("Permission check passed: Requesting user is admin/staff."); // Log Succès Admin/Staff
        }

        // --- LOG JUSTE AVANT LE BLOCAGE ---
        console.log(`Comparing certificate.doctor_id (${certificate.doctor_id}) === loggedInDoctorId (${loggedInDoctorId})`);
        console.log(`Final isAllowed value before check: ${isAllowed}`);
        // --- FIN LOG ---

        if (!isAllowed) {
            console.log(`Permission DENIED for user ${requestingUserId} (role: ${requestingUserRole}, loggedInDoctorId: ${loggedInDoctorId}) to view certificate ${certificateId} (issued by doctor ${certificate.doctor_id})`); // Log Échec
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

        // Return the full certificate details
        console.log("Permission granted. Returning certificate details."); // Log final avant réponse
        res.status(200).json(certificate);

    } catch (error) {
        console.error('Error fetching certificate details:', error);
        res.status(500).json({ message: 'An error occurred while fetching certificate details.' });
    }
    console.log(`--- End Debug getCertificateDetails (Cert ID: ${certificateId}) ---`); // Log fin
};

// Ajoutez d'autres fonctions liées aux certificats ici (get, list pour docteur, etc.)
exports.listDoctorCertificates = async (req, res) => {
    const doctorUserId = req.user.id; // ID de l'utilisateur (docteur) connecté
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        // D'abord, trouver le doctor_id correspondant au user_id
        const doctorProfile = await Doctor.findOne({
            where: { user_id: doctorUserId },
            attributes: ['doctor_id']
        });

        if (!doctorProfile) {
            return res.status(400).json({ message: "Doctor profile not found for the logged-in user." });
        }
        const actualDoctorId = doctorProfile.doctor_id;

        // Ensuite, trouver les certificats émis par ce doctor_id
        const { count, rows } = await Certificate.findAndCountAll({
            where: { doctor_id: actualDoctorId },
            limit: limit,
            offset: offset,
            order: [['issue_date', 'DESC']], // Ordonner par date d'émission, plus récent d'abord
            // Sélectionnez les champs nécessaires pour l'affichage de l'historique
            attributes: ['certificate_id', 'applicant_first_name', 'applicant_last_name', 'issue_date', 'expiry_date', 'status', 'qr_code_identifier']
        });

        const totalPages = Math.ceil(count / limit);

        // Log l'action
        await auditService.logAction({
            userId: doctorUserId,
            action: 'doctor_list_certificates',
            ipAddress: req.ip,
            details: { page, limit }
        });

        res.status(200).json({
            totalItems: count,
            totalPages: totalPages,
            currentPage: page,
            certificates: rows // Renvoie le tableau des certificats
        });

    } catch (error) {
        console.error('Error listing doctor certificates:', error);
        res.status(500).json({ message: 'An error occurred while listing certificates.' });
    }
}; 