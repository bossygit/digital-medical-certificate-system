import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Stack } from 'react-bootstrap';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userRoleDisplay = user?.role === 'dgtt_admin' ? 'Admin' : 'Staff';

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-4">
                <Col>
                    <h1>Bienvenue {user ? `${user.firstName} ${user.lastName}` : ''}</h1>
                    <p className="text-muted">Tableau de Bord Administration DGTT ({userRoleDisplay})</p>
                </Col>
                <Col xs="auto">
                    <Button variant="outline-danger" onClick={handleLogout}>Déconnexion</Button>
                </Col>
            </Row>

            <Row>
                <Col>
                    <h2>Actions Administrateur</h2>
                    <Stack direction="horizontal" gap={2} className="mt-3 flex-wrap">
                        {/* Link to manage doctors page */}
                        <Button as={Link} to="/admin/doctors" variant="primary">
                            Gérer les Médecins Agréés
                        </Button>

                        {/* Button for statistics (placeholder) */}
                        <Button variant="secondary" disabled>
                            Voir les Statistiques
                        </Button>

                        {/* Link to verification page */}
                        <Button as={Link} to="/verification" variant="info">
                            Vérifier un Certificat
                        </Button>

                        {/* Admin-only actions (placeholder) */}
                        {user?.role === 'dgtt_admin' && (
                            <Button variant="warning" disabled>
                                Envoyer Notifications Expiration
                            </Button>
                        )}
                    </Stack>

                    <Button as={Link} to="/admin/add-doctor" variant="success" className="mt-3 mb-3">
                        <i className="fas fa-plus"></i> Ajouter un Médecin
                    </Button>
                </Col>
            </Row>
            {/* Add more sections for admin tasks later */}
        </Container>
    );
};

export default AdminDashboard; 