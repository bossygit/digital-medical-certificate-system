import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../services/admin.service';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';

const StatCard = ({ title, value, icon, variant = 'primary' }) => (
    <Col md={6} lg={4} className="mb-4">
        <Card border={variant} className="h-100">
            <Card.Body className="d-flex flex-column align-items-center text-center">
                {icon && <i className={`fas ${icon} fa-3x text-${variant} mb-3`}></i>}
                <Card.Title as="h5" className="text-muted">{title}</Card.Title>
                <Card.Text as="h2" className="fw-bold">{value ?? '...'}</Card.Text>
            </Card.Body>
        </Card>
    </Col>
);


const AdminStatsPage = () => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await adminService.getGlobalStats();
            setStats(data);
        } catch (err) {
            setError(err.message || 'Erreur lors du chargement des statistiques.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-4">
                <Col><h1>Statistiques du Système</h1></Col>
                <Col xs="auto">
                    <Button as={Link} to="/admin/dashboard" variant="outline-secondary">Tableau de Bord Admin</Button>
                </Col>
            </Row>

            {isLoading && (
                <div className="text-center my-5"><Spinner animation="border" /></div>
            )}

            {error && <Alert variant="danger">{error}</Alert>}

            {!isLoading && stats && (
                <>
                    {/* Section Utilisateurs */}
                    <h3 className="mb-3">Utilisateurs</h3>
                    <Row className="mb-4">
                        <StatCard title="Total Utilisateurs" value={stats.users?.total} icon="fa-users" variant="info" />
                        <StatCard title="Administrateurs" value={stats.users?.byRole?.dgtt_admin} icon="fa-user-shield" variant="warning" />
                        <StatCard title="Staff DGTT" value={stats.users?.byRole?.dgtt_staff} icon="fa-user-cog" variant="secondary" />
                    </Row>

                    {/* Section Médecins */}
                    <h3 className="mb-3">Médecins</h3>
                    <Row className="mb-4">
                        <StatCard title="Total Médecins" value={stats.doctors?.total} icon="fa-user-md" variant="primary" />
                        <StatCard title="Médecins Actifs" value={stats.doctors?.active} icon="fa-check-circle" variant="success" />
                        <StatCard title="Médecins Inactifs" value={stats.doctors?.inactive} icon="fa-times-circle" variant="danger" />
                    </Row>

                    {/* Section Certificats */}
                    <h3 className="mb-3">Certificats</h3>
                    <Row>
                        <StatCard title="Total Certificats Émis" value={stats.certificates?.total} icon="fa-file-medical-alt" variant="success" />
                        <StatCard title="Certificats 'Issued'" value={stats.certificates?.byStatus?.issued} icon="fa-check" variant="primary" />
                        <StatCard title="Certificats 'Expired'" value={stats.certificates?.byStatus?.expired} icon="fa-calendar-times" variant="warning" />
                        <StatCard title="Certificats 'Revoked'" value={stats.certificates?.byStatus?.revoked} icon="fa-ban" variant="danger" />
                        {/* Ajoutez 'verified' si pertinent */}
                    </Row>
                </>
            )}
        </Container>
    );
};

export default AdminStatsPage;
