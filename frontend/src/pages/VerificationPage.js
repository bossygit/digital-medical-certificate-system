import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import certificateService from '../services/certificate.service';
import { Container, Row, Col, Alert, Spinner, Card, ListGroup, Form, Button } from 'react-bootstrap'; // Import RB components

const VerificationPage = () => {
    const { qrId: idFromParams } = useParams();
    const [verificationResult, setVerificationResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [manualQrId, setManualQrId] = useState('');
    const [qrIdToVerify, setQrIdToVerify] = useState(idFromParams || '');

    const verifyCertificateById = useCallback(async (idToVerify) => {
        if (!idToVerify) {
            setError('Identifiant QR requis pour la vérification.');
            return;
        }
        setIsLoading(true);
        setError('');
        setVerificationResult(null);
        setQrIdToVerify(idToVerify);

        try {
            const result = await certificateService.verifyCertificateByQr(idToVerify);
            setVerificationResult(result);
        } catch (err) {
            const message = err.message || 'Une erreur est survenue lors de la vérification.';
            setError(message);
            if (err.message && (err.message.includes('not found') || err.message.includes('introuvable'))) {
                setVerificationResult({ isValid: false, message: message });
            } else {
                setVerificationResult(null);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (idFromParams) {
            verifyCertificateById(idFromParams);
        } else {
            setIsLoading(false);
        }
    }, [idFromParams, verifyCertificateById]);

    const handleManualVerify = (e) => {
        e.preventDefault();
        if (manualQrId) {
            verifyCertificateById(manualQrId.trim());
        } else {
            setError('Veuillez entrer un identifiant QR.');
        }
    };

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
                    <h2 className="mb-4">Vérification du Certificat Médical</h2>

                    {!idFromParams ? (
                        <Card className="mb-4">
                            <Card.Body>
                                <Card.Title>Entrer un Identifiant QR</Card.Title>
                                <Form onSubmit={handleManualVerify}>
                                    <Form.Group className="mb-3" controlId="manualQrIdInput">
                                        <Form.Label>Identifiant QR du certificat :</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Collez ou tapez l'identifiant ici"
                                            value={manualQrId}
                                            onChange={(e) => setManualQrId(e.target.value)}
                                            disabled={isLoading}
                                            required
                                        />
                                    </Form.Group>
                                    <Button variant="primary" type="submit" disabled={isLoading}>
                                        {isLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Vérifier'}
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>
                    ) : (
                        <p className="mb-4">Identifiant scanné : <strong className="text-primary">{idFromParams}</strong></p>
                    )}

                    {isLoading && (
                        <div className="text-center my-4">
                            <Spinner animation="border" role="status" variant="primary" />
                            <p className="mt-2">Vérification en cours pour l'ID : {qrIdToVerify}...</p>
                        </div>
                    )}

                    {!isLoading && error && (
                        <Alert variant="danger" onClose={() => setError('')} dismissible className="mt-3">
                            {error}
                        </Alert>
                    )}

                    {!isLoading && verificationResult && (
                        <Alert variant={verificationResult.isValid ? 'success' : 'danger'} className="mt-3">
                            <Alert.Heading>
                                {verificationResult.isValid ? 'Certificat Valide' : 'Certificat Invalide ou Introuvable'}
                                {qrIdToVerify && <small className="text-muted ms-2">(ID: {qrIdToVerify})</small>}
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
                                            <span className={`ms-2 badge bg-${verificationResult.certificate.status === 'issued' || verificationResult.certificate.status === 'verified' ? 'success' : 'warning'}`}>
                                                {verificationResult.certificate.status}
                                            </span>
                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                            <span className="fw-bold">Médecin Émetteur:</span> {verificationResult.certificate.doctorName || 'Non spécifié'}
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