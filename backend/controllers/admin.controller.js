const db = require('../models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // For generating temp password
const auditService = require('../services/audit.service'); // Import audit service

// === Doctor Management ===

// List all doctors with pagination
exports.listDoctors = async (req, res) => {
    const adminUserId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const { count, rows } = await db.User.findAndCountAll({
            where: { role: 'doctor' },
            limit: limit,
            offset: offset,
            order: [['last_name', 'ASC'], ['first_name', 'ASC']],
            attributes: ['user_id', 'email', 'first_name', 'last_name', 'is_active'], // Select user fields
            include: [
                {
                    model: db.Doctor,
                    as: 'doctorProfile',
                    attributes: ['agrement_number', 'specialty'] // Select doctor fields
                }
            ]
        });

        const totalPages = Math.ceil(count / limit);

        // Log action
        await auditService.logAction({
            userId: adminUserId,
            action: 'admin_list_doctors',
            ipAddress: req.ip,
            details: { page, limit }
        });

        res.status(200).json({
            totalItems: count,
            totalPages: totalPages,
            currentPage: page,
            doctors: rows
        });

    } catch (error) {
        console.error('Error listing doctors:', error);
        res.status(500).json({ message: 'An error occurred while listing doctors.' });
    }
};

// Add a new doctor
exports.addDoctor = async (req, res) => {
    const adminUserId = req.user.id; // Get admin ID from auth middleware
    const {
        email,
        first_name,
        last_name,
        agrement_number,
        phone_number,
        specialty,
        office_address
    } = req.body;

    // 1. Validate required fields
    if (!email || !first_name || !last_name || !agrement_number) {
        return res.status(400).json({ message: 'Missing required fields: email, first_name, last_name, agrement_number.' });
    }

    const t = await db.sequelize.transaction(); // Start transaction

    try {
        // 2. Check for uniqueness
        const existingUser = await db.User.findOne({ where: { email }, transaction: t });
        if (existingUser) {
            await t.rollback();
            return res.status(409).json({ message: 'Email already exists.' });
        }
        const existingDoctor = await db.Doctor.findOne({ where: { agrement_number }, transaction: t });
        if (existingDoctor) {
            await t.rollback();
            return res.status(409).json({ message: 'Agreement number already exists.' });
        }

        // 3. Generate temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex'); // Generate a 16-char hex password
        console.log(`Generated temp password for ${email}: ${tempPassword}`); // Log for admin/testing ONLY - REMOVE FOR PROD

        // 4. Hash the temporary password (for both user table and doctor table temp field)
        const saltRounds = 10;
        const hashedTempPassword = await bcrypt.hash(tempPassword, saltRounds);

        // 5. Set temp password expiry (e.g., 48 hours from now)
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 48);

        // 6. Create User record within the transaction
        const newUser = await db.User.create({
            email,
            password_hash: hashedTempPassword, // Use hashed temp password initially
            role: 'doctor',
            first_name,
            last_name,
            phone_number: phone_number || null,
            is_active: true // Activate account immediately
        }, { transaction: t });

        // 7. Create Doctor record within the transaction
        await db.Doctor.create({
            doctor_id: newUser.user_id, // Link to the created User
            agrement_number,
            specialty: specialty || null,
            office_address: office_address || null,
            temp_password: hashedTempPassword, // Store the hashed temp password here too
            temp_password_expiry: expiryDate
        }, { transaction: t });

        // 8. Commit the transaction
        await t.commit();

        // ---> Log successful doctor addition <---
        await auditService.logAction({
            userId: adminUserId, // The admin performing the action
            action: 'admin_add_doctor',
            ipAddress: req.ip,
            targetType: 'user',
            targetId: newUser.user_id, // ID of the newly created doctor user
            details: { doctorEmail: newUser.email, agrement: agrement_number }
        });

        // 9. TODO: Send welcome email/SMS with the PLAIN TEXT tempPassword
        // This step requires integration with an external service (e.g., Nodemailer, Twilio)
        // SendEmail(email, "Welcome - Your Temporary Password", `Your temporary password is: ${tempPassword}`);

        // 10. Return success response (excluding password info)
        res.status(201).json({
            message: 'Doctor added successfully. Temporary password generated.',
            userId: newUser.user_id,
            email: newUser.email
            // DO NOT return the temporary password here
        });

    } catch (error) {
        await t.rollback(); // Rollback transaction on any error
        // ---> Log failed doctor addition attempt (Optional) <---
        // await auditService.logAction({
        //     userId: adminUserId,
        //     action: 'admin_add_doctor_failed',
        //     ipAddress: req.ip,
        //     details: { reason: error.message, attemptedEmail: email, attemptedAgrement: agrement_number }
        // });
        console.error('Error adding doctor:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Validation error', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'An error occurred while adding the doctor.' });
    }
};

// Get details of a specific doctor
exports.getDoctorDetails = async (req, res) => {
    const adminUserId = req.user.id;
    const doctorUserId = parseInt(req.params.id); // Already validated as int > 0

    try {
        const doctorUser = await db.User.findOne({
            where: { user_id: doctorUserId, role: 'doctor' }, // Ensure it's a doctor
            attributes: ['user_id', 'email', 'first_name', 'last_name', 'phone_number', 'is_active', 'createdAt', 'updatedAt'],
            include: [
                {
                    model: db.Doctor,
                    as: 'doctorProfile',
                    attributes: { exclude: ['temp_password', 'temp_password_expiry'] } // Exclude sensitive temp info
                }
            ]
        });

        if (!doctorUser) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        // Log action
        await auditService.logAction({
            userId: adminUserId,
            action: 'admin_get_doctor_details',
            ipAddress: req.ip,
            targetType: 'user',
            targetId: doctorUserId
        });

        res.status(200).json(doctorUser);

    } catch (error) {
        console.error('Error getting doctor details:', error);
        res.status(500).json({ message: 'An error occurred while getting doctor details.' });
    }
};

// Update doctor information (by Admin)
exports.updateDoctor = async (req, res) => {
    const adminUserId = req.user.id; // Admin performing the action
    const doctorUserId = parseInt(req.params.id); // Already validated
    const { first_name, last_name, phone_number, specialty, office_address } = req.body;

    // Create objects with only the fields allowed and provided for update
    const userDataToUpdate = {};
    if (req.body.hasOwnProperty('first_name')) userDataToUpdate.first_name = first_name;
    if (req.body.hasOwnProperty('last_name')) userDataToUpdate.last_name = last_name;
    if (req.body.hasOwnProperty('phone_number')) userDataToUpdate.phone_number = phone_number;

    const doctorDataToUpdate = {};
    if (req.body.hasOwnProperty('specialty')) doctorDataToUpdate.specialty = specialty;
    if (req.body.hasOwnProperty('office_address')) doctorDataToUpdate.office_address = office_address;

    if (Object.keys(userDataToUpdate).length === 0 && Object.keys(doctorDataToUpdate).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    const t = await db.sequelize.transaction();

    try {
        // Ensure the target user exists and is a doctor before updating
        const doctorUser = await db.User.findOne({
            where: { user_id: doctorUserId, role: 'doctor' },
            transaction: t
        });
        if (!doctorUser) {
            await t.rollback();
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        // Update User table if needed
        if (Object.keys(userDataToUpdate).length > 0) {
            await db.User.update(userDataToUpdate, {
                where: { user_id: doctorUserId },
                transaction: t
            });
        }

        // Update Doctor table if needed
        if (Object.keys(doctorDataToUpdate).length > 0) {
            await db.Doctor.update(doctorDataToUpdate, {
                where: { doctor_id: doctorUserId },
                transaction: t
            });
        }

        await t.commit();

        // Log the action
        const updatedFields = { ...userDataToUpdate, ...doctorDataToUpdate };
        await auditService.logAction({
            userId: adminUserId,
            action: 'admin_update_doctor_profile',
            ipAddress: req.ip,
            targetType: 'user',
            targetId: doctorUserId,
            details: { updatedFields }
        });

        // Fetch the updated profile to return it (optional)
        const updatedProfile = await db.User.findOne({
            where: { user_id: doctorUserId },
            attributes: ['user_id', 'email', 'first_name', 'last_name', 'phone_number', 'is_active'],
            include: [{
                model: db.Doctor,
                as: 'doctorProfile',
                attributes: ['agrement_number', 'specialty', 'office_address']
            }]
        });

        res.status(200).json({
            message: 'Doctor profile updated successfully by admin.',
            profile: updatedProfile
        });

    } catch (error) {
        await t.rollback();
        console.error('Error updating doctor profile by admin:', error);
        res.status(500).json({ message: 'An error occurred while updating the doctor profile.' });
    }
};

// Activate/Suspend a doctor account
exports.updateDoctorStatus = async (req, res) => {
    const adminUserId = req.user.id;
    const doctorUserId = parseInt(req.params.id); // Already validated
    const { isActive } = req.body; // Already validated as boolean

    try {
        // Find the user first to ensure they exist and are a doctor
        const userToUpdate = await db.User.findOne({
            where: { user_id: doctorUserId, role: 'doctor' }
        });

        if (!userToUpdate) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        // Update the is_active status
        await db.User.update(
            { is_active: isActive },
            { where: { user_id: doctorUserId } }
        );

        // Log the action
        await auditService.logAction({
            userId: adminUserId,
            action: isActive ? 'admin_activate_doctor' : 'admin_suspend_doctor',
            ipAddress: req.ip,
            targetType: 'user',
            targetId: doctorUserId,
            details: { newStatus: isActive }
        });

        res.status(200).json({
            message: `Doctor account successfully ${isActive ? 'activated' : 'suspended'}.`,
            userId: doctorUserId,
            isActive: isActive
        });

    } catch (error) {
        console.error('Error updating doctor status:', error);
        res.status(500).json({ message: 'An error occurred while updating doctor status.' });
    }
};

// === Statistics and Reports ===

// Get certificate statistics
exports.getCertificateStats = async (req, res) => {
    const adminUserId = req.user.id;

    try {
        // Count total certificates
        const totalCertificates = await db.Certificate.count();

        // Count certificates by status
        const countByStatus = await db.Certificate.findAll({
            attributes: [
                'status',
                [db.sequelize.fn('COUNT', db.sequelize.col('status')), 'count']
            ],
            group: ['status']
        });

        // Format the countByStatus result into a more usable object
        const statsByStatus = countByStatus.reduce((acc, item) => {
            acc[item.get('status')] = parseInt(item.get('count'), 10);
            return acc;
        }, {
            issued: 0, // Initialize all expected statuses
            verified: 0,
            expired: 0,
            revoked: 0
        });

        // Log action
        await auditService.logAction({
            userId: adminUserId,
            action: 'admin_get_certificate_stats',
            ipAddress: req.ip
        });

        res.status(200).json({
            totalCertificates: totalCertificates,
            countByStatus: statsByStatus
            // Add more stats as needed (e.g., over time)
        });

    } catch (error) {
        console.error('Error fetching certificate stats:', error);
        res.status(500).json({ message: 'An error occurred while fetching certificate statistics.' });
    }
};

// === Notifications ===

// Placeholder sendExpiryNotifications function
exports.sendExpiryNotifications = async (req, res) => {
    // TODO: Implement logic to find certificates expiring soon
    // 1. Define criteria (e.g., expiring in next 30 days)
    // 2. Find relevant certificates and associated user contact info
    // 3. Integrate with an email/SMS service to send notifications
    // Log action
    res.status(501).json({ message: 'Send expiry notifications not implemented yet.' });
}; 