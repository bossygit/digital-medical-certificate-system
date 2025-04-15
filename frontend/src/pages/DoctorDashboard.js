import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Stack } from 'react-bootstrap'; // Import React-Bootstrap components

const DoctorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login'); // Redirect to login after logout, if not handled by AuthProvider
    };

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-4">
                <Col>
                    <h1>Bienvenue Dr. {user ? `${user.firstName} ${user.lastName}` : ''}</h1>
                    <p className="text-muted">Tableau de Bord Médecin</p>
                </Col>
                <Col xs="auto">
                    <Button variant="outline-danger" onClick={handleLogout}>Déconnexion</Button>
                </Col>
            </Row>

            <Row>
                <Col>
                    <h2>Actions Rapides</h2>
                    <Stack direction="horizontal" gap={2} className="mt-3 flex-wrap"> { /* Use Stack for button layout */}
                        <Button as={Link} to="/doctor/issue-certificate" variant="primary">
                            Émettre un Nouveau Certificat
                        </Button>
                        <Button as={Link} to="/doctor/history" variant="secondary">
                            Voir Mon Historique
                        </Button>
                        <Button as={Link} to="/doctor/profile" variant="info">
                            Modifier Mon Profil
                        </Button>
                    </Stack>
                </Col>
            </Row>

            {/* Can add sections for recent activity, statistics etc. later using Card, ListGroup etc. */}
        </Container>
    );
};

export default DoctorDashboard; 