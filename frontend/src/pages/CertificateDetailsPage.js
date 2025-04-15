import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import certificateService from '../services/certificate.service';
import { Container, Card, Row, Col, Spinner, Alert, Image, Button } from 'react-bootstrap';
import QRCode from 'qrcode'; // Importez la librairie QR Code

const CertificateDetailsPage = () => {
    const { id } = useParams(); // Récupère l'ID depuis l'URL
    const navigate = useNavigate();
    const [certificate, setCertificate] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const generateQrCode = useCallback(async (identifier) => {
        if (!identifier) return;
        try {
            // Construire l'URL de vérification pointant vers le frontend
            const verificationUrl = `${window.location.origin}/verification/${identifier}`;
            const url = await QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: 'H', width: 200 });
            setQrCodeUrl(url);
        } catch (err) {
            console.error('Failed to generate QR code', err);
            // Gérer l'erreur de génération QR si nécessaire
        }
    }, []);

    useEffect(() => {
        const fetchDetails = async () => {
            setIsLoading(true);
            setError('');
            setCertificate(null);
            setQrCodeUrl(''); // Réinitialiser le QR code

            try {
                const data = await certificateService.getCertificateDetails(id);
                setCertificate(data);
                // Générer le QR Code une fois les données reçues
                if (data?.qr_code_identifier) {
                    await generateQrCode(data.qr_code_identifier);
                }
            } catch (err) {
                setError(err.message || 'Impossible de charger les détails du certificat.');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchDetails();
        } else {
            setError('ID du certificat manquant.');
            setIsLoading(false);
        }
    }, [id, generateQrCode]); // Ajouter generateQrCode aux dépendances

    // Fonction pour formater les dates
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-FR', { // Utilisez le format local souhaité
            year: 'numeric', month: 'long', day: 'numeric',
            // Optional: timeZone: 'UTC' // Si les dates sont stockées en UTC
        });
    };

    return (
        <Container className="mt-4">
            <Button variant="outline-secondary" onClick={() => navigate(-1)} className="mb-3">
                <i className="fas fa-arrow-left me-2"></i>Retour
            </Button>

            <h2>Détails du Certificat Médical</h2>

            {isLoading && (
                <div className="text-center my-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </Spinner>
                </div>
            )}

            {error && <Alert variant="danger">{error}</Alert>}

            {certificate && !isLoading && (
                <Card>
                    <Card.Header>Certificat ID: {certificate.certificate_id}</Card.Header>
                    <Card.Body>
                        <Row>
                            {/* Colonne Informations */}
                            <Col md={8}>
                                <Card.Title>Demandeur</Card.Title>
                                <p><strong>Nom:</strong> {certificate.applicant_last_name}, {certificate.applicant_first_name}</p>
                                <p><strong>Date de Naissance:</strong> {formatDate(certificate.applicant_dob)}</p>
                                <p><strong>Adresse:</strong> {certificate.applicant_address}</p>

                                <hr />
                                <Card.Title>Informations Médicales</Card.Title>
                                <p><strong>Date d'Émission:</strong> {formatDate(certificate.issue_date)}</p>
                                <p><strong>Date d'Expiration:</strong> {formatDate(certificate.expiry_date)}</p>
                                <p><strong>Statut:</strong> <span className={`badge bg-${certificate.status === 'issued' ? 'primary' : (certificate.status === 'revoked' ? 'danger' : 'secondary')}`}>{certificate.status}</span></p>
                                <p><strong>Apte:</strong> {certificate.is_fit ? <span className="text-success">Oui</span> : <span className="text-danger">Non</span>}</p>
                                <p><strong>Constatations:</strong></p>
                                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{certificate.medical_findings}</pre>

                                <hr />
                                <Card.Title>Médecin Émetteur</Card.Title>
                                {certificate.issuingDoctor?.user ? (
                                    <>
                                        <p><strong>Nom:</strong> Dr. {certificate.issuingDoctor.user.first_name} {certificate.issuingDoctor.user.last_name}</p>
                                        <p><strong>Email:</strong> {certificate.issuingDoctor.user.email}</p>
                                        {/* Ajoutez d'autres infos médecin si nécessaire (spécialité, etc.) */}
                                    </>
                                ) : (
                                    <p>Information du médecin non disponible.</p>
                                )}

                                <hr />
                                <p><small><strong>Identifiant QR:</strong> {certificate.qr_code_identifier}</small></p>
                                <p><small><strong>Signature Numérique (Hash):</strong> {certificate.digital_signature}</small></p>

                            </Col>

                            {/* Colonne QR Code */}
                            <Col md={4} className="text-center align-self-center">
                                {qrCodeUrl ? (
                                    <>
                                        <Image src={qrCodeUrl} alt={`QR Code pour ${certificate.qr_code_identifier}`} fluid thumbnail />
                                        <p className="mt-2"><small>Scannez pour vérifier</small></p>
                                    </>
                                ) : (
                                    <p>Génération du QR code...</p>
                                )}
                                {/* Ajouter bouton Imprimer/Télécharger PDF ? */}
                            </Col>
                        </Row>
                    </Card.Body>
                    <Card.Footer>
                        <small className="text-muted">Certificat généré le: {formatDate(certificate.createdAt)}</small>
                    </Card.Footer>
                </Card>
            )}
        </Container>
    );
};

export default CertificateDetailsPage;
