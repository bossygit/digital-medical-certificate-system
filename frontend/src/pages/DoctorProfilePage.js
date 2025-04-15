import React, { useState, useEffect, useCallback } from 'react';
import doctorService from '../services/doctor.service';
import { Link } from 'react-router-dom';

// Basic styling
const styles = {
    container: { maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' },
    formGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px' },
    input: { width: '100%', padding: '8px', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '8px', minHeight: '80px', boxSizing: 'border-box' },
    button: { padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' },
    message: { marginTop: '15px', padding: '10px', borderRadius: '3px' },
    error: { backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' },
    success: { backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
    loading: { fontStyle: 'italic' },
    link: { marginTop: '20px', display: 'inline-block' }
};

const DoctorProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
        specialty: '',
        office_address: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch profile data on mount
    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            setError('');
            try {
                const data = await doctorService.getDoctorProfile();
                setProfile(data); // Store the full profile (includes email, agrement etc.)
                // Initialize form data with current profile values
                setFormData({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    phone_number: data.phone_number || '',
                    specialty: data.doctorProfile?.specialty || '',
                    office_address: data.doctorProfile?.office_address || ''
                });
            } catch (err) {
                setError(err.message || 'Failed to load profile.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsSubmitting(true);

        // Prepare only changed data to send
        const changedData = {};
        for (const key in formData) {
            // Check user fields
            if (['first_name', 'last_name', 'phone_number'].includes(key)) {
                if (formData[key] !== (profile[key] || '')) {
                    changedData[key] = formData[key];
                }
            }
            // Check doctorProfile fields
            if (['specialty', 'office_address'].includes(key)) {
                if (formData[key] !== (profile.doctorProfile?.[key] || '')) {
                    changedData[key] = formData[key];
                }
            }
        }

        if (Object.keys(changedData).length === 0) {
            setSuccessMessage("Aucune modification détectée.");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await doctorService.updateDoctorProfile(changedData);
            setSuccessMessage(response.message || 'Profil mis à jour avec succès.');
            // Update local profile state to reflect changes immediately
            setProfile(response.profile);
            // Re-sync form data in case backend modified/validated something
            setFormData({
                first_name: response.profile.first_name || '',
                last_name: response.profile.last_name || '',
                phone_number: response.profile.phone_number || '',
                specialty: response.profile.doctorProfile?.specialty || '',
                office_address: response.profile.doctorProfile?.office_address || ''
            });

        } catch (err) {
            setError(err.message || 'Échec de la mise à jour du profil.');
            // Handle validation errors array if present
            if (err.errors) {
                const errorMsg = err.errors.map(e => e.msg).join(', ');
                setError(`Erreurs de validation: ${errorMsg}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div style={styles.container}><p style={styles.loading}>Chargement du profil...</p></div>;
    }

    if (error && !profile) { // Show only error if profile failed to load
        return <div style={styles.container}><p style={{ ...styles.message, ...styles.error }}>{error}</p></div>;
    }

    return (
        <div style={styles.container}>
            <h2>Mon Profil Médecin</h2>
            <Link to="/doctor/dashboard" style={styles.link}>Retour au Tableau de Bord</Link>

            <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                {error && <p style={{ ...styles.message, ...styles.error }}>{error}</p>}
                {successMessage && <p style={{ ...styles.message, ...styles.success }}>{successMessage}</p>}

                {/* Display non-editable fields */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>Email:</label>
                    <input type="text" value={profile?.email || ''} readOnly style={{ ...styles.input, backgroundColor: '#e9ecef' }} />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>N° Agrément:</label>
                    <input type="text" value={profile?.doctorProfile?.agrement_number || ''} readOnly style={{ ...styles.input, backgroundColor: '#e9ecef' }} />
                </div>

                {/* Editable fields */}
                <div style={styles.formGroup}>
                    <label htmlFor="first_name" style={styles.label}>Prénom:</label>
                    <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} style={styles.input} />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="last_name" style={styles.label}>Nom:</label>
                    <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} style={styles.input} />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="phone_number" style={styles.label}>Téléphone:</label>
                    <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} style={styles.input} />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="specialty" style={styles.label}>Spécialité:</label>
                    <input type="text" name="specialty" value={formData.specialty} onChange={handleChange} style={styles.input} />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="office_address" style={styles.label}>Adresse du Cabinet:</label>
                    <textarea name="office_address" value={formData.office_address} onChange={handleChange} style={styles.textarea} />
                </div>

                <button type="submit" disabled={isSubmitting} style={styles.button}>
                    {isSubmitting ? 'Mise à jour...' : 'Mettre à Jour le Profil'}
                </button>
            </form>
        </div>
    );
};

export default DoctorProfilePage; 