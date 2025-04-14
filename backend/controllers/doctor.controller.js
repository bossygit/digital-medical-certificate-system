const db = require('../models');
const auditService = require('../services/audit.service'); // Import audit service

// Get Doctor's own profile
exports.getProfile = async (req, res) => {
    const userId = req.user.id; // From authenticateToken middleware

    try {
        const userProfile = await db.User.findByPk(userId, {
            attributes: ['user_id', 'email', 'first_name', 'last_name', 'phone_number', 'role', 'is_active'], // Select specific User fields
            include: [
                {
                    model: db.Doctor,
                    as: 'doctorProfile',
                    attributes: ['agrement_number', 'specialty', 'office_address'] // Select specific Doctor fields
                }
            ]
        });

        if (!userProfile) {
            // This should ideally not happen if the user is authenticated
            return res.status(404).json({ message: 'Profile not found.' });
        }

        // Log profile access
        await auditService.logAction({
            userId: userId,
            action: 'doctor_get_profile',
            ipAddress: req.ip
        });

        res.status(200).json(userProfile);

    } catch (error) {
        console.error('Error fetching doctor profile:', error);
        res.status(500).json({ message: 'An error occurred while fetching the profile.' });
    }
};

// Update Doctor's own profile
exports.updateProfile = async (req, res) => {
    const userId = req.user.id; // From authenticateToken middleware
    const { first_name, last_name, phone_number, specialty, office_address } = req.body;

    // Create objects with only the fields we intend to update and that were actually passed
    const userDataToUpdate = {};
    if (req.body.hasOwnProperty('first_name')) userDataToUpdate.first_name = first_name;
    if (req.body.hasOwnProperty('last_name')) userDataToUpdate.last_name = last_name;
    if (req.body.hasOwnProperty('phone_number')) userDataToUpdate.phone_number = phone_number; // Allow setting to null

    const doctorDataToUpdate = {};
    if (req.body.hasOwnProperty('specialty')) doctorDataToUpdate.specialty = specialty;
    if (req.body.hasOwnProperty('office_address')) doctorDataToUpdate.office_address = office_address;

    // Check if there is anything to update (after validation middleware already ran)
    if (Object.keys(userDataToUpdate).length === 0 && Object.keys(doctorDataToUpdate).length === 0) {
        // Note: Validation might have caught this, but double-check
        return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    const t = await db.sequelize.transaction();

    try {
        // Update User table if needed
        if (Object.keys(userDataToUpdate).length > 0) {
            await db.User.update(userDataToUpdate, {
                where: { user_id: userId },
                transaction: t
            });
        }

        // Update Doctor table if needed
        if (Object.keys(doctorDataToUpdate).length > 0) {
            await db.Doctor.update(doctorDataToUpdate, {
                where: { doctor_id: userId }, // doctor_id is the same as user_id for doctors
                transaction: t
            });
        }

        await t.commit();

        // Log profile update
        const updatedFields = { ...userDataToUpdate, ...doctorDataToUpdate };
        await auditService.logAction({
            userId: userId,
            action: 'doctor_update_profile',
            ipAddress: req.ip,
            details: { updatedFields } // Log what was changed
        });

        // Fetch the updated profile to return it
        const updatedProfile = await db.User.findByPk(userId, {
            attributes: ['user_id', 'email', 'first_name', 'last_name', 'phone_number', 'role', 'is_active'],
            include: [{
                model: db.Doctor,
                as: 'doctorProfile',
                attributes: ['agrement_number', 'specialty', 'office_address']
            }]
        });

        res.status(200).json({
            message: 'Profile updated successfully.',
            profile: updatedProfile
        });

    } catch (error) {
        await t.rollback();
        console.error('Error updating doctor profile:', error);
        if (error.name === 'SequelizeValidationError') {
            // This might be caught by express-validator, but good to have fallback
            return res.status(400).json({ message: 'Validation error', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'An error occurred while updating the profile.' });
    }
};

// Get Doctor's certificate history with pagination
exports.getCertificateHistory = async (req, res) => {
    const doctorId = req.user.id;
    const page = parseInt(req.query.page) || 1;      // Default to page 1
    const limit = parseInt(req.query.limit) || 10;   // Default to 10 items per page
    const offset = (page - 1) * limit;

    try {
        const { count, rows } = await db.Certificate.findAndCountAll({
            where: { doctor_id: doctorId },
            limit: limit,
            offset: offset,
            order: [['issue_date', 'DESC']], // Order by most recent first
            // Select only necessary fields for the list view
            attributes: [
                'certificate_id',
                'applicant_first_name',
                'applicant_last_name',
                'issue_date',
                'status',
                'qr_code_identifier'
            ]
        });

        const totalPages = Math.ceil(count / limit);

        // Log action
        await auditService.logAction({
            userId: doctorId,
            action: 'doctor_get_certificate_history',
            ipAddress: req.ip,
            details: { page, limit }
        });

        res.status(200).json({
            totalItems: count,
            totalPages: totalPages,
            currentPage: page,
            certificates: rows
        });

    } catch (error) {
        console.error('Error fetching certificate history:', error);
        res.status(500).json({ message: 'An error occurred while fetching certificate history.' });
    }
};

// Get Doctor's digital carnet summary
exports.getCarnetSummary = async (req, res) => {
    const doctorId = req.user.id;

    try {
        // Count total certificates issued by this doctor
        const totalCertificates = await db.Certificate.count({
            where: { doctor_id: doctorId }
        });

        // Example: Count certificates issued in the current year
        const currentYear = new Date().getFullYear();
        const certificatesThisYear = await db.Certificate.count({
            where: {
                doctor_id: doctorId,
                issue_date: {
                    [db.Sequelize.Op.gte]: new Date(`${currentYear}-01-01T00:00:00Z`),
                    [db.Sequelize.Op.lt]: new Date(`${currentYear + 1}-01-01T00:00:00Z`)
                }
            }
        });

        // Add more stats as needed (e.g., this month, by status)

        // Log action
        await auditService.logAction({
            userId: doctorId,
            action: 'doctor_get_carnet_summary',
            ipAddress: req.ip
        });

        res.status(200).json({
            totalCertificatesIssued: totalCertificates,
            certificatesIssuedThisYear: certificatesThisYear,
            // Add other stats here
        });

    } catch (error) {
        console.error('Error fetching carnet summary:', error);
        res.status(500).json({ message: 'An error occurred while fetching the carnet summary.' });
    }
}; 