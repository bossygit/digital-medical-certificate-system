const db = require('../models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // For generating temp password
const auditService = require('../services/audit.service'); // Import audit service
const { generateTemporaryPassword } = require('../utils/passwordUtils'); // À créer
const { Certificate, Doctor, User, sequelize } = require('../models'); // Assurez-vous d'importer les modèles nécessaires

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
                    attributes: ['doctor_id', 'specialty', 'agrement_number'] // Champs du docteur
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
    const adminUserId = req.user.id;
    const {
        email,
        first_name,
        last_name,
        specialty,
        license_number,
        phone_number,
        office_address,
        agrement_number
    } = req.body;

    const transaction = await db.sequelize.transaction();

    try {
        // 1. Vérifier si l'email existe déjà
        const existingUser = await db.User.findOne({ where: { email }, transaction });
        if (existingUser) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Email already exists' });
        }

        // 2. Générer un mot de passe temporaire
        const tempPassword = generateTemporaryPassword();
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

        // 3. Créer l'utilisateur
        const newUser = await db.User.create({
            email,
            password_hash: hashedPassword,
            role: 'doctor',
            first_name,
            last_name,
            phone_number,
            is_active: true
        }, { transaction });

        // 4. Créer l'enregistrement Docteur
        const newDoctor = await db.Doctor.create({
            user_id: newUser.user_id,
            specialty,
            agrement_number: agrement_number,
            office_address
        }, { transaction });

        // 5. Valider la transaction
        await transaction.commit();

        console.log(`Doctor added: ${email} / Temp Password: ${tempPassword}`);
        // TODO: Envoyer email

        // 6. Renvoyer une réponse de succès
        res.status(201).json({
            message: 'Doctor added successfully.',
            doctor: {
                userId: newUser.user_id,
                doctorId: newDoctor.doctor_id,
                email: newUser.email,
                firstName: newUser.first_name,
                lastName: newUser.last_name,
                specialty: newDoctor.specialty,
                licenseNumber: newDoctor.license_number,
                office_address: newDoctor.office_address,
                agrementNumber: newDoctor.agrement_number
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error adding doctor:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Server error while adding doctor' });
    }
};

// Get details of a specific doctor
exports.getDoctorDetails = async (req, res) => {
    const adminUserId = req.user.id;
    const doctorUserId = parseInt(req.params.id);

    try {
        const doctorUser = await db.User.findOne({
            where: { user_id: doctorUserId, role: 'doctor' },
            attributes: ['user_id', 'email', 'first_name', 'last_name', 'phone_number', 'is_active', 'createdAt', 'updatedAt'],
            include: [
                {
                    model: db.Doctor,
                    as: 'doctorProfile',
                    attributes: { exclude: ['user_id', 'createdAt', 'updatedAt'] }
                }
            ]
        });

        if (!doctorUser) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

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
    const adminUserId = req.user.id;
    const doctorUserId = parseInt(req.params.id);
    const { first_name, last_name, phone_number, specialty, office_address } = req.body;

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
        const doctorUser = await db.User.findOne({
            where: { user_id: doctorUserId, role: 'doctor' },
            include: [{ model: db.Doctor, as: 'doctorProfile' }],
            transaction: t
        });

        if (!doctorUser || !doctorUser.doctorProfile) {
            await t.rollback();
            return res.status(404).json({ message: 'Doctor or doctor profile not found.' });
        }

        const doctorRecordId = doctorUser.doctorProfile.doctor_id;

        // Update User table
        if (Object.keys(userDataToUpdate).length > 0) {
            await db.User.update(userDataToUpdate, {
                where: { user_id: doctorUserId },
                transaction: t
            });
        }

        // Update Doctor table
        if (Object.keys(doctorDataToUpdate).length > 0) {
            await db.Doctor.update(doctorDataToUpdate, {
                where: { doctor_id: doctorRecordId },
                transaction: t
            });
        }

        await t.commit();

        const updatedFields = { ...userDataToUpdate, ...doctorDataToUpdate };
        await auditService.logAction({
            userId: adminUserId,
            action: 'admin_update_doctor_profile',
            ipAddress: req.ip,
            targetType: 'user',
            targetId: doctorUserId,
            details: { updatedFields }
        });

        const updatedProfile = await db.User.findOne({
            where: { user_id: doctorUserId },
            attributes: ['user_id', 'email', 'first_name', 'last_name', 'phone_number', 'is_active'],
            include: [{
                model: db.Doctor,
                as: 'doctorProfile',
                attributes: ['doctor_id', 'specialty', 'license_number', 'office_address']
            }]
        });

        res.status(200).json({
            message: 'Doctor profile updated successfully by admin.',
            profile: updatedProfile
        });

    } catch (error) {
        await t.rollback();
        console.error('Error updating doctor profile by admin:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'An error occurred while updating doctor profile.' });
    }
};

// Activate/Suspend a doctor account
exports.updateDoctorStatus = async (req, res) => {
    const adminUserId = req.user.id;
    const doctorUserId = parseInt(req.params.id);
    const { isActive } = req.body;

    try {
        const userToUpdate = await db.User.findOne({
            where: { user_id: doctorUserId, role: 'doctor' }
        });

        if (!userToUpdate) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        const [affectedRows] = await db.User.update(
            { is_active: isActive },
            { where: { user_id: doctorUserId } }
        );

        if (affectedRows === 0) {
            console.warn(`Update status for doctor ${doctorUserId} resulted in 0 affected rows.`);
        }

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

// Delete a doctor account
exports.deleteDoctor = async (req, res) => {
    const adminUserId = req.user.id;
    const doctorUserId = parseInt(req.params.id);

    const transaction = await db.sequelize.transaction();
    try {
        const userToDelete = await db.User.findOne({
            where: { user_id: doctorUserId, role: 'doctor' },
            include: [{ model: db.Doctor, as: 'doctorProfile' }],
            transaction
        });

        if (!userToDelete) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Docteur non trouvé.' });
        }

        const doctorRecordId = userToDelete.doctorProfile?.doctor_id;

        if (doctorRecordId) {
            await db.Doctor.destroy({
                where: { doctor_id: doctorRecordId },
                transaction
            });
        } else {
            console.warn(`User with ID ${doctorUserId} has role 'doctor' but no associated doctor profile found during deletion.`);
        }

        const deletedUserRows = await db.User.destroy({
            where: { user_id: doctorUserId },
            transaction
        });

        if (deletedUserRows === 0) {
            throw new Error(`Failed to delete user record for user ID ${doctorUserId}.`);
        }

        await transaction.commit();

        await auditService.logAction({
            userId: adminUserId,
            action: 'admin_delete_doctor',
            ipAddress: req.ip,
            targetType: 'user',
            targetId: doctorUserId,
            details: { deletedEmail: userToDelete.email }
        });

        res.status(200).json({ message: `Doctor account (ID: ${doctorUserId}) deleted successfully.` });

    } catch (error) {
        await transaction.rollback();
        console.error(`Error deleting doctor (ID: ${doctorUserId}):`, error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ message: 'Cannot delete doctor. They have existing associated records (e.g., certificates).' });
        }
        res.status(500).json({ message: 'An error occurred while deleting the doctor.' });
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

// === Certificate Management (Admin) ===

exports.listAllCertificates = async (req, res) => {
    const adminUserId = req.user.id; // ID de l'admin connecté
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15; // Un peu plus par page peut-être
    const offset = (page - 1) * limit;

    try {
        const { count, rows } = await Certificate.findAndCountAll({
            limit: limit,
            offset: offset,
            order: [['issue_date', 'DESC']], // Trier par date d'émission
            include: [ // Inclure les infos du médecin émetteur
                {
                    model: Doctor,
                    as: 'issuingDoctor',
                    attributes: ['doctor_id', 'agrement_number'], // Champs Doctor pertinents
                    include: {
                        model: User,
                        as: 'user',
                        attributes: ['user_id', 'first_name', 'last_name'] // Champs User pertinents
                    }
                }
            ],
            // Sélectionnez les champs Certificat nécessaires pour la liste admin
            attributes: [
                'certificate_id', 'applicant_first_name', 'applicant_last_name',
                'issue_date', 'expiry_date', 'status', 'qr_code_identifier'
            ]
        });

        const totalPages = Math.ceil(count / limit);

        // Formatter les résultats pour inclure le nom du docteur directement
        const formattedCertificates = rows.map(cert => {
            const plainCert = cert.get({ plain: true }); // Obtenir l'objet simple
            plainCert.doctorName = plainCert.issuingDoctor?.user
                ? `${plainCert.issuingDoctor.user.first_name} ${plainCert.issuingDoctor.user.last_name}`
                : 'N/A';
            plainCert.doctorAgrement = plainCert.issuingDoctor?.agrement_number || 'N/A';
            delete plainCert.issuingDoctor; // Supprimer l'objet imbriqué après extraction
            return plainCert;
        });


        // Log l'action
        await auditService.logAction({
            userId: adminUserId,
            action: 'admin_list_all_certificates',
            ipAddress: req.ip,
            details: { page, limit }
        });

        res.status(200).json({
            totalItems: count,
            totalPages: totalPages,
            currentPage: page,
            certificates: formattedCertificates // Utiliser les certificats formatés
        });

    } catch (error) {
        console.error('Error listing all certificates for admin:', error);
        res.status(500).json({ message: 'An error occurred while listing certificates.' });
    }
};

// === Statistics ===

exports.getGlobalStats = async (req, res) => {
    const adminUserId = req.user.id;

    try {
        // --- Récupérer les statistiques ---

        // 1. Certificats
        const totalCertificates = await Certificate.count();
        const certificatesByStatusRaw = await Certificate.findAll({
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
            group: ['status']
        });
        const certificatesByStatus = certificatesByStatusRaw.reduce((acc, item) => {
            acc[item.get('status')] = parseInt(item.get('count'), 10);
            return acc;
        }, { issued: 0, verified: 0, expired: 0, revoked: 0 }); // Initialiser tous les statuts

        // 2. Utilisateurs
        const totalUsers = await User.count();
        const usersByRoleRaw = await User.findAll({
            attributes: ['role', [sequelize.fn('COUNT', sequelize.col('role')), 'count']],
            group: ['role']
        });
        const usersByRole = usersByRoleRaw.reduce((acc, item) => {
            acc[item.get('role')] = parseInt(item.get('count'), 10);
            return acc;
        }, { doctor: 0, dgtt_admin: 0, dgtt_staff: 0 }); // Initialiser tous les rôles

        // 3. Médecins Actifs/Inactifs
        const activeDoctors = await User.count({ where: { role: 'doctor', is_active: true } });
        const inactiveDoctors = await User.count({ where: { role: 'doctor', is_active: false } });


        // --- Construire la réponse ---
        const stats = {
            certificates: {
                total: totalCertificates,
                byStatus: certificatesByStatus
            },
            users: {
                total: totalUsers,
                byRole: usersByRole
            },
            doctors: {
                total: usersByRole.doctor || 0, // Total doctors from usersByRole
                active: activeDoctors,
                inactive: inactiveDoctors
            }
            // Ajoutez d'autres stats ici si nécessaire
        };

        // Log l'action
        await auditService.logAction({
            userId: adminUserId,
            action: 'admin_get_global_stats',
            ipAddress: req.ip
        });

        res.status(200).json(stats);

    } catch (error) {
        console.error('Error fetching global stats:', error);
        res.status(500).json({ message: 'An error occurred while fetching statistics.' });
    }
};

// Garder ou supprimer l'ancien endpoint getCertificateStats selon besoin
// exports.getCertificateStats = async (req, res) => { ... };

// Ajoutez d'autres fonctions admin ici (getDoctors, updateDoctor, deleteDoctor, etc.)
exports.getDoctors = async (req, res) => { /* ... logique ... */ res.status(501).json({ message: "Not implemented" }); };
exports.deleteDoctor = async (req, res) => { /* ... logique ... */ res.status(501).json({ message: "Not implemented" }); }; 