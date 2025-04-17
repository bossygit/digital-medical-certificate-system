import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/auth.service';
import { Link } from 'react-router-dom';
import { Container, Form, Button, Alert, Row, Col, Spinner, Image } from 'react-bootstrap';
import loginImage from '../assets/images/doctor-patient-login.jpg';

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
            if (err.message && err.message.includes('Invalid') && err.response?.status === 401) {
                setError('Email ou mot de passe invalide.');
            } else if (err.response?.data?.requiresFirstLogin) {
                setError(<>Compte temporaire détecté. Veuillez <Link to="/first-login">compléter la première connexion</Link>.</>);
            } else {
                setError(err.message || 'La connexion a échoué. Veuillez réessayer.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container fluid className="vh-100 p-0">
            <Row className="g-0 h-100">
                <Col md={7} className="bg-success text-white d-flex flex-column justify-content-between p-5">
                    <div>
                        <div className="mb-5">

                            <h1 className="fw-bold">DGTT - Portail de contrôle médical</h1>
                        </div>
                        <h2 className="display-4 fw-bold mb-4">Bienvenue sur votre espace </h2>
                        <p className="lead">
                            Gérez les dossiers médicaux en toute sécurité.
                        </p>
                    </div>
                    <Image
                        src={loginImage}
                        alt="Professionnel de santé avec un patient"
                        fluid
                        rounded
                        className="mt-4 align-self-center"
                        style={{ maxWidth: '80%', maxHeight: '300px', objectFit: 'cover' }}
                    />
                </Col>

                <Col md={5} className="d-flex flex-column align-items-center justify-content-center bg-light p-5">
                    <div className="w-100" style={{ maxWidth: '400px' }}>
                        <div className="text-center mb-4">
                            <span className="fa-stack fa-2x">
                                <i className="fas fa-circle fa-stack-2x text-success-light"></i>
                                <i className="fas fa-stethoscope fa-stack-1x fa-inverse text-success"></i>
                            </span>
                        </div>

                        <h3 className="text-center mb-2 fw-bold">Connexion</h3>
                        <p className="text-center text-muted mb-4">Accédez à votre espace </p>

                        <Form onSubmit={handleSubmit}>
                            {error && (
                                <Alert variant="danger" onClose={() => setError('')} dismissible>
                                    {error}
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
                                    size="lg"
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
                                    size="lg"
                                />
                            </Form.Group>

                            <Row className="mb-3 align-items-center">
                                <Col>
                                    <Form.Check
                                        type="checkbox"
                                        label="Se souvenir de moi"
                                        id="rememberMeCheckbox"
                                        disabled={isLoading}
                                    />
                                </Col>
                                <Col xs="auto">
                                    <Link to="/request-password-reset" className="text-success">Mot de passe oublié ?</Link>
                                </Col>
                            </Row>

                            <Button variant="success" type="submit" disabled={isLoading} className="w-100" size="lg">
                                {isLoading ? (
                                    <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Connexion...</>
                                ) : (
                                    'Se connecter'
                                )}
                            </Button>
                        </Form>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default LoginPage; 