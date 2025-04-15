const db = require('../models'); // Accès aux modèles (pour AuditLog)

/**
 * Enregistre une action dans le journal d'audit.
 * @param {object} logData - Les données à enregistrer.
 * @param {number} logData.userId - L'ID de l'utilisateur effectuant l'action.
 * @param {string} logData.action - Description de l'action (ex: 'admin_list_doctors').
 * @param {string} [logData.ipAddress] - L'adresse IP de l'utilisateur.
 * @param {string} [logData.targetType] - Le type de ressource affectée (ex: 'user', 'doctor', 'certificate').
 * @param {number|string} [logData.targetId] - L'ID de la ressource affectée.
 * @param {object} [logData.details] - Détails supplémentaires sur l'action (objet JSON).
 */
async function logAction(logData) {
    try {
        if (!logData || !logData.userId || !logData.action) {
            console.error('Audit log failed: Missing required fields (userId, action).', logData);
            return; // Ne pas bloquer l'opération principale si le log échoue
        }

        await db.AuditLog.create({ // Assurez-vous que le modèle s'appelle bien AuditLog
            user_id: logData.userId,
            action: logData.action,
            ip_address: logData.ipAddress || null,
            target_type: logData.targetType || null,
            target_id: logData.targetId ? String(logData.targetId) : null, // Assurez-vous que target_id est une chaîne si nécessaire
            details: logData.details || null,
            // timestamp est géré automatiquement par Sequelize (defaultValue: NOW)
        });
        // console.log('Audit log created successfully.'); // Optionnel: log de succès

    } catch (error) {
        // Log l'erreur mais ne la propage pas pour ne pas interrompre le flux principal
        console.error('Error creating audit log entry:', {
            logDataAttempted: logData,
            errorMessage: error.message,
            errorStack: error.stack // Peut être utile pour le débogage
        });
    }
}

// Exportez la fonction pour qu'elle puisse être importée ailleurs
module.exports = {
    logAction
};
