import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/auth.service';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Form, Button, Alert, Row, Col, Spinner } from 'react-bootstrap';

const FirstLoginPage = () => {
    const [email, setEmail] = useState('');
    const [tempPassword, setTempPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login: contextLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Frontend validation
        if (!email || !tempPassword || !newPassword || !confirmPassword) {
            setError('Tous les champs sont requis.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Les nouveaux mots de passe ne correspondent pas.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Le nouveau mot de passe doit comporter au moins 8 caractères.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.firstLogin(email, tempPassword, newPassword);
            // Response includes { message, token, user }
            contextLogin(response.user, response.token); // Update context and redirect

        } catch (err) {
            setError(err.message || 'La première connexion a échoué. Vérifiez vos informations.');
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
        <Container className="mt-5">
            <Row className="justify-content-md-center">
                <Col md={6} lg={5}>
                    <h2>Première Connexion - Médecin</h2>
                    <p className="text-muted mb-4">Veuillez entrer votre email, le mot de passe temporaire fourni et définir votre nouveau mot de passe.</p>
                    <Form onSubmit={handleSubmit}>
                        {error && (
                            <Alert variant="danger" onClose={() => setError('')} dismissible>
                                {error}
                            </Alert>
                        )}
                        <Form.Group className="mb-3" controlId="firstLoginEmail">
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
                        <Form.Group className="mb-3" controlId="firstLoginTempPassword">
                            <Form.Label>Mot de passe Temporaire</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Mot de passe temporaire"
                                value={tempPassword}
                                onChange={(e) => setTempPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="firstLoginNewPassword">
                            <Form.Label>Nouveau Mot de Passe</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Minimum 8 caractères"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                aria-describedby="passwordHelpBlock"
                            />
                            <Form.Text id="passwordHelpBlock" muted>
                                Votre mot de passe doit comporter au moins 8 caractères.
                            </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="firstLoginConfirmPassword">
                            <Form.Label>Confirmer Nouveau Mot de Passe</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Confirmez le mot de passe"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                isInvalid={!!error && error.includes('correspondent pas')} // Highlight if mismatch error
                            />
                            <Form.Control.Feedback type="invalid">
                                Les mots de passe ne correspondent pas.
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Button variant="primary" type="submit" disabled={isLoading} className="w-100 mt-3">
                            {isLoading ? (
                                <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Mise à jour...</>
                            ) : (
                                'Définir le Mot de Passe et Connexion'
                            )}
                        </Button>
                    </Form>
                    <div className="mt-3 text-center">
                        <Link to="/login">Retour à la connexion standard</Link>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default FirstLoginPage; 