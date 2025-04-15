import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/auth.service';
import { Link } from 'react-router-dom';
import { Container, Form, Button, Alert, Row, Col, Spinner } from 'react-bootstrap'; // Import necessary components

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login: contextLogin } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await authService.login(email, password);
            contextLogin(response.user, response.token);

        } catch (err) {
            if (err.message && err.message.includes('Temporary password') && err.response?.data?.requiresFirstLogin) {
                // Render the link within the error state
                setError(<>Compte temporaire détecté. Veuillez <Link to="/first-login">compléter la première connexion</Link>.</>);
            } else {
                setError(err.message || 'La connexion a échoué. Veuillez vérifier vos identifiants.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container>
            <Row className="justify-content-md-center mt-5">
                <Col md={6} lg={4}>
                    <h2 className="mb-3">Connexion</h2>
                    <Form onSubmit={handleSubmit}>
                        {error && (
                            <Alert variant="danger" onClose={() => setError('')} dismissible>
                                {error} { /* Display error which might contain a Link */}
                            </Alert>
                        )}
                        <Form.Group className="mb-3" controlId="formBasicEmail">
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

                        <Form.Group className="mb-3" controlId="formBasicPassword">
                            <Form.Label>Mot de passe</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" disabled={isLoading} className="w-100">
                            {isLoading ? (
                                <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Connexion...</>
                            ) : (
                                'Se connecter'
                            )}
                        </Button>
                    </Form>
                    <div className="mt-3 text-center">
                        <Link to="/request-password-reset">Mot de passe oublié ?</Link>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default LoginPage; 