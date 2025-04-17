import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import certificateService from '../services/certificate.service';
import { Container, Row, Col, Alert, Spinner, Card, ListGroup } from 'react-bootstrap'; // Import RB components

const VerificationPage = () => {
    const { qrId } = useParams();
    const [verificationResult, setVerificationResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [manualQrId, setManualQrId] = useState('');

    useEffect(() => {
        const verify = async () => {
            setIsLoading(true);
            setError('');
            setVerificationResult(null);

            if (!qrId) {
                setError(`Identifiant QR manquant dans l'URL.`);
                setIsLoading(false);
                return;
            }

            try {
                const result = await certificateService.verifyCertificate(qrId);
                setVerificationResult(result);
            } catch (err) {
                // Attempt to parse backend error message if available
                const message = err.response?.data?.message || err.message || 'Une erreur est survenue lors de la vérification.';
                setError(message);
                // Set a generic invalid result if the error indicates not found (e.g., 404)
                if (err.response?.status === 404) {
                    setVerificationResult({ isValid: false, message: message || 'Certificat non trouvé.' });
                } else {
                    // Keep result null for other types of errors
                    setVerificationResult(null);
                }
            } finally {
                setIsLoading(false);
            }
        };

        verify();
    }, [qrId]);

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualQrId) {
            // Appeler la fonction qui lance la vérification API avec manualQrId
            verifyCertificate(manualQrId);
        } else {
            setError('Veuillez entrer un identifiant QR.');
        }
    };

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
            return new Date(dateString).toLocaleDateString('fr-FR', options);
        } catch (e) {
            console.error("Error formatting date:", e);
            return dateString;
        }
    };

    return (
        <Container className="mt-4">
            <Row className="justify-content-md-center">
                <Col md={8} lg={7}>
                    <h2 className="mb-3">Vérification du Certificat Médical</h2>
                    <p>Identifiant scanné: <strong className="text-primary">{qrId || 'N/A'}</strong></p>

                    {isLoading && (
                        <div className="text-center my-5">
                            <Spinner animation="border" role="status" variant="primary">
                                <span className="visually-hidden">Vérification en cours...</span>
                            </Spinner>
                            <p className="mt-2">Vérification en cours...</p>
                        </div>
                    )}

                    {error && !verificationResult && ( // Show general error only if no result is displayed
                        <Alert variant="danger" onClose={() => setError('')} dismissible>
                            {error}
                        </Alert>
                    )}

                    {verificationResult && (
                        <Alert variant={verificationResult.isValid ? 'success' : 'danger'} className="mt-4">
                            <Alert.Heading>
                                {verificationResult.isValid ? 'Certificat Valide' : 'Certificat Invalide ou Introuvable'}
                            </Alert.Heading>
                            <p>{verificationResult.message}</p>

                            {verificationResult.isValid && verificationResult.certificate && (
                                <>
                                    <hr />
                                    <h4 className="mb-3">Détails du Certificat</h4>
                                    <ListGroup variant="flush">
                                        <ListGroup.Item>
                                            <span className="fw-bold">Demandeur:</span> {verificationResult.certificate.applicantFirstName} {verificationResult.certificate.applicantLastName}
                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                            <span className="fw-bold">Date de Naissance:</span> {formatDate(verificationResult.certificate.applicantDob)}
                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                            <span className="fw-bold">Apte à la conduite:</span> {verificationResult.certificate.isFit ? 'Oui' : 'Non'}
                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                            <span className="fw-bold">Date d'émission:</span> {formatDate(verificationResult.certificate.issueDate)}
                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                            <span className="fw-bold">Statut:</span>
                                            <span className={`ms-2 badge bg-${verificationResult.certificate.status === 'Valide' ? 'success' : 'warning'}`}>
                                                {verificationResult.certificate.status}
                                            </span>
                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                            <span className="fw-bold">Médecin Émetteur:</span> {verificationResult.certificate.doctorName}
                                        </ListGroup.Item>
                                        {verificationResult.certificate.expiryDate && (
                                            <ListGroup.Item>
                                                <span className="fw-bold">Date d'expiration:</span> {formatDate(verificationResult.certificate.expiryDate)}
                                            </ListGroup.Item>
                                        )}
                                    </ListGroup>
                                </>
                            )}
                        </Alert>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default VerificationPage; 