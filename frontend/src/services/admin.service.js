import apiClient from './api'; // Assurez-vous que api.js est configuré et exporte l'instance axios

/**
 * Ajoute un nouveau docteur via l'API admin.
 * @param {object} doctorData - Les données du docteur à ajouter.
 * @param {string} doctorData.email
 * @param {string} doctorData.first_name
 * @param {string} doctorData.last_name
 * @param {string} doctorData.agrement_number
 * @param {string} [doctorData.specialty]
 * @param {string} [doctorData.phone_number]
 * @param {string} [doctorData.office_address]
 * @returns {Promise<object>} - La réponse de l'API (contenant les détails du docteur ajouté).
 */
const addDoctor = async (doctorData) => {
    try {
        // Note: Le backend attend les champs en snake_case basé sur la dernière correction
        // Assurez-vous que l'objet doctorData envoyé ici correspond bien
        const response = await apiClient.post('/admin/doctors', doctorData);
        return response.data; // Renvoie { message, doctor: { ... } }
    } catch (error) {
        console.error('Add Doctor API error:', error.response ? error.response.data : error.message);
        // Renvoie l'erreur pour que le composant puisse l'afficher
        throw new Error(error.response?.data?.message || 'Failed to add doctor. Please try again.');
    }
};

// Ajoutez d'autres fonctions de service admin ici (listDoctors, etc.)
const listDoctors = async (page = 1, limit = 10) => {
    try {
        const response = await apiClient.get('/admin/doctors', { params: { page, limit } });
        return response.data; // { totalItems, totalPages, currentPage, doctors }
    } catch (error) {
        console.error('List Doctors API error:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch doctors.');
    }
}

/**
 * Récupère la liste de tous les certificats pour l'admin (paginée).
 * @param {number} page La page à récupérer.
 * @param {number} limit Le nombre d'éléments par page.
 * @returns {Promise<object>} Les données paginées des certificats.
 */
const listAllCertificates = async (page = 1, limit = 15) => {
    try {
        const response = await apiClient.get('/admin/certificates', {
            params: { page, limit }
        });
        return response.data;
    } catch (error) {
        console.error('Admin List Certificates API error:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch certificate list.');
    }
};

const adminService = {
    addDoctor,
    listDoctors,
    // getDoctorDetails,
    // updateDoctor,
    // updateDoctorStatus,
    listAllCertificates,
};

export default adminService;
