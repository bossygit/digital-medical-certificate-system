import React, { useState } from 'react';
import authService from '../services/auth.service';
import { Link } from 'react-router-dom';
import { Container, Form, Button, Alert, Row, Col, Spinner } from 'react-bootstrap';

const RequestPasswordResetPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            const response = await authService.requestPasswordReset(email);
            setMessage(response.message || 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.');
        } catch (err) {
            // Show generic message even on error for security
            setMessage('Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.');
            console.error("Password reset request failed:", err); // Log the actual error for debugging
            // You could potentially set a specific error if the API call itself fails (e.g., network error)
            // setError('Impossible de traiter la demande pour le moment.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-md-center">
                <Col md={6} lg={5}>
                    <h2>Réinitialiser Mot de Passe</h2>
                    <p className="text-muted mb-4">Entrez votre adresse email. Si un compte correspondant existe, nous enverrons un lien pour réinitialiser votre mot de passe.</p>

                    {/* Display success/info message */}
                    {message && (
                        <Alert variant="info" onClose={() => setMessage('')} dismissible>
                            {message}
                        </Alert>
                    )}

                    {/* Display error message (if used in the future) */}
                    {error && (
                        <Alert variant="danger" onClose={() => setError('')} dismissible>
                            {error}
                        </Alert>
                    )}

                    {/* Hide form after successful submission message is shown */}
                    {!message && (
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3" controlId="resetEmail">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="Entrez votre email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </Form.Group>
                            <Button variant="primary" type="submit" disabled={isLoading} className="w-100">
                                {isLoading ? (
                                    <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Envoi en cours...</>
                                ) : (
                                    'Envoyer le Lien'
                                )}
                            </Button>
                        </Form>
                    )}

                    <div className="mt-3 text-center">
                        <Link to="/login">Retour à la connexion</Link>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default RequestPasswordResetPage; 