import React, { useState } from 'react';
import certificateService from '../services/certificate.service';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Form, Button, Alert, Row, Col, Spinner, Card, Image } from 'react-bootstrap'; // Import components

const IssueCertificatePage = () => {
    const [formData, setFormData] = useState({
        applicant_first_name: '',
        applicant_last_name: '',
        applicant_dob: '',
        applicant_address: '',
        medical_findings: '',
        is_fit: true, // Default to fit (boolean)
        expiry_date: '' // Optional
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [result, setResult] = useState(null); // Pour stocker le certificat et le QR code
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => {
            let newValue = value;
            if (name === 'is_fit') {
                newValue = value === 'true'; // Convert radio value string ('true'/'false') to boolean
            } else if (type === 'checkbox') {
                newValue = checked;
            }
            return { ...prev, [name]: newValue };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        setResult(null); // Réinitialiser les résultats précédents

        // Basic frontend validation (backend validation is primary)
        if (!formData.applicant_first_name || !formData.applicant_last_name || !formData.applicant_dob || !formData.applicant_address || !formData.medical_findings) {
            setError('Veuillez remplir tous les champs obligatoires.');
            setIsLoading(false);
            return;
        }

        try {
            const dataToSend = { ...formData };

            // Ensure is_fit is boolean
            dataToSend.is_fit = Boolean(formData.is_fit);

            if (!dataToSend.expiry_date) {
                delete dataToSend.expiry_date; // Don't send empty string if optional
            }

            const response = await certificateService.issueCertificate(dataToSend);
            setSuccess(response.message || 'Certificat émis avec succès !');
            setResult(response); // Stocker la réponse complète (cert + QR code)
            // Clear form after successful submission
            setFormData({
                applicant_first_name: '',
                applicant_last_name: '',
                applicant_dob: '',
                applicant_address: '',
                medical_findings: '',
                is_fit: true,
                expiry_date: ''
            });
            // Consider adding a button in the success message to view the certificate or navigate automatically
            // navigate(`/doctor/certificate/${response.certificateId}`); // Example navigation

        } catch (err) {
            setError(err.message || `Échec de l'émission du certificat.`);
            // Handle specific validation errors if backend provides them
            if (err.errors) {
                const errorMsg = err.errors.map(e => e.msg).join(', ');
                setError(`Erreurs de validation: ${errorMsg}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container className="mt-4">
            <Row className="justify-content-md-center">
                <Col md={8} lg={7}>
                    <Card>
                        <Card.Header as="h2">Émettre un Nouveau Certificat Médical</Card.Header>
                        <Card.Body>
                            <Link to="/doctor/dashboard" className="btn btn-outline-secondary mb-3">Retour au Tableau de Bord</Link>

                            <Form onSubmit={handleSubmit}>
                                {error && (
                                    <Alert variant="danger" onClose={() => setError('')} dismissible>
                                        {error}
                                    </Alert>
                                )}
                                {success && !result && (
                                    <Alert variant="success" onClose={() => setSuccess('')} dismissible>
                                        {success}
                                    </Alert>
                                )}

                                <h4>Informations Demandeur</h4>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="applicant_first_name">
                                            <Form.Label>Prénom</Form.Label>
                                            <Form.Control type="text" name="applicant_first_name" value={formData.applicant_first_name} onChange={handleChange} required disabled={isLoading} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="applicant_last_name">
                                            <Form.Label>Nom</Form.Label>
                                            <Form.Control type="text" name="applicant_last_name" value={formData.applicant_last_name} onChange={handleChange} required disabled={isLoading} />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Form.Group className="mb-3" controlId="applicant_dob">
                                    <Form.Label>Date de Naissance</Form.Label>
                                    <Form.Control type="date" name="applicant_dob" value={formData.applicant_dob} onChange={handleChange} required disabled={isLoading} />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="applicant_address">
                                    <Form.Label>Adresse</Form.Label>
                                    <Form.Control as="textarea" rows={3} name="applicant_address" value={formData.applicant_address} onChange={handleChange} required disabled={isLoading} />
                                </Form.Group>

                                <h4 className="mt-4">Constatations Médicales</h4>
                                <Form.Group className="mb-3" controlId="medical_findings">
                                    <Form.Label>Résultats Examen</Form.Label>
                                    <Form.Control as="textarea" rows={4} name="medical_findings" value={formData.medical_findings} onChange={handleChange} required disabled={isLoading} />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="is_fit">
                                    <Form.Label>Apte à la conduite?</Form.Label>
                                    <div> { /* Wrap radios for proper layout */}
                                        <Form.Check
                                            inline
                                            type="radio"
                                            label="Oui"
                                            name="is_fit"
                                            id="fit_yes"
                                            value="true"
                                            checked={formData.is_fit === true}
                                            onChange={handleChange}
                                            disabled={isLoading}
                                        />
                                        <Form.Check
                                            inline
                                            type="radio"
                                            label="Non"
                                            name="is_fit"
                                            id="fit_no"
                                            value="false"
                                            checked={formData.is_fit === false}
                                            onChange={handleChange}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="expiry_date">
                                    <Form.Label>Date d'Expiration (Optionnel)</Form.Label>
                                    <Form.Control type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} disabled={isLoading} />
                                </Form.Group>

                                <Button variant="success" type="submit" disabled={isLoading} className="w-100 mt-3">
                                    {isLoading ? (
                                        <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Émission en cours...</>
                                    ) : (
                                        'Émettre le Certificat'
                                    )}
                                </Button>
                            </Form>

                            {/* Section pour afficher le résultat */}
                            {result && (
                                <Card className="mt-4">
                                    <Card.Header>Certificat Émis</Card.Header>
                                    <Card.Body className="text-center">
                                        {success && <Alert variant="success">{success}</Alert>}
                                        <p><strong>Demandeur:</strong> {result.certificate.applicantName}</p>
                                        <p><strong>Statut:</strong> {result.certificate.status}</p>
                                        <p><strong>Apte:</strong> {result.certificate.isFit ? 'Oui' : 'Non'}</p>
                                        <p><strong>Identifiant QR:</strong> {result.certificate.qrIdentifier}</p>
                                        <Image src={result.qrCodeDataURL} alt="QR Code de Vérification" thumbnail style={{ maxWidth: '200px' }} />
                                        <p className="mt-2"><small>Scannez ce code pour vérifier le certificat.</small></p>
                                    </Card.Body>
                                </Card>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default IssueCertificatePage; 