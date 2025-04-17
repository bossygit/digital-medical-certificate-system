import apiClient from './api';

/**
 * Crée un nouveau certificat médical.
 * @param {object} certificateData Les données du certificat.
 * @returns {Promise<object>} La réponse de l'API { message, certificate, qrCodeDataURL }
 */
const issueCertificate = async (certificateData) => {
    try {
        // Assurez-vous que les noms des champs correspondent à ce que l'API attend
        const response = await apiClient.post('/certificates', certificateData);
        return response.data;
    } catch (error) {
        console.error('Issue Certificate API error:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to issue certificate.');
    }
};

/**
 * Récupère l'historique des certificats pour le docteur connecté.
 * @param {number} page - Le numéro de page.
 * @param {number} limit - Le nombre d'éléments par page.
 * @returns {Promise<object>} La réponse de l'API { totalItems, totalPages, currentPage, certificates }
 */
const getDoctorHistory = async (page = 1, limit = 10) => {
    try {
        const response = await apiClient.get('/certificates', {
            params: { page, limit } // Envoie les paramètres de pagination
        });
        return response.data;
    } catch (error) {
        console.error('Get Doctor History API error:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch certificate history.');
    }
};

/**
 * Récupère les détails d'un certificat spécifique par son ID.
 * @param {number|string} id L'ID du certificat.
 * @returns {Promise<object>} Les détails complets du certificat.
 */
const getCertificateDetails = async (id) => {
    try {
        const response = await apiClient.get(`/certificates/${id}`);
        return response.data;
    } catch (error) {
        console.error('Get Certificate Details API error:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch certificate details.');
    }
};

/**
 * Vérifie un certificat en utilisant son identifiant QR.
 * @param {string} qrIdentifier L'identifiant UUID du QR code.
 * @returns {Promise<object>} Le résultat de la vérification.
 */
const verifyCertificateByQr = async (qrIdentifier) => {
    try {
        // Assurez-vous que le endpoint correspond à celui défini dans verification.routes.js
        const response = await apiClient.get(`/verify/${qrIdentifier}`);
        return response.data;
    } catch (error) {
        console.error('Verify Certificate API error:', error.response ? error.response.data : error.message);
        // Renvoyer une structure d'erreur cohérente ou laisser l'erreur se propager
        throw new Error(error.response?.data?.message || 'Failed to verify certificate.');
    }
};

// Ajoutez d'autres fonctions (list, get) ici

const certificateService = {
    issueCertificate,
    getDoctorHistory,
    getCertificateDetails,
    verifyCertificateByQr,
    // listDoctorCertificates,
    // getCertificateDetails
};

export default certificateService;
