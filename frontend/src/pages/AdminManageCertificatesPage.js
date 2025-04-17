import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../services/admin.service'; // Utilisez le service admin
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button, Table, Pagination, Spinner, Alert } from 'react-bootstrap';

const AdminManageCertificatesPage = () => {
    const [certificates, setCertificates] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(15); // Correspondre à l'API

    // Fonction pour récupérer les certificats
    const fetchCertificates = useCallback(async (page) => {
        setIsLoading(true);
        setError('');
        try {
            // Appel à la nouvelle fonction du service admin
            const data = await adminService.listAllCertificates(page, limit);
            setCertificates(data.certificates || []);
            setTotalPages(data.totalPages || 1);
            setCurrentPage(data.currentPage || 1);
        } catch (err) {
            setError(err.message || 'Échec du chargement de la liste des certificats.');
            setCertificates([]);
        } finally {
            setIsLoading(false);
        }
    }, [limit]);

    // Charger les certificats au montage et au changement de page
    useEffect(() => {
        fetchCertificates(currentPage);
    }, [currentPage, fetchCertificates]);

    // --- Logique de Pagination (à copier/adapter depuis une autre page) ---
    const handlePageChange = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const renderPaginationItems = () => {
        // ... (Copiez/collez la logique de renderPaginationItems ici) ...
        let items = [];
        const maxPagesToShow = 5;
        let startPage, endPage;
        if (totalPages <= maxPagesToShow) { startPage = 1; endPage = totalPages; }
        else { /* ... logique complexe ... */
            if (currentPage <= Math.ceil(maxPagesToShow / 2)) { startPage = 1; endPage = maxPagesToShow; }
            else if (currentPage + Math.floor(maxPagesToShow / 2) >= totalPages) { startPage = totalPages - maxPagesToShow + 1; endPage = totalPages; }
            else { startPage = currentPage - Math.floor(maxPagesToShow / 2); endPage = currentPage + Math.floor(maxPagesToShow / 2); }
        }
        items.push(<Pagination.First key="first" onClick={() => handlePageChange(1)} disabled={currentPage === 1 || isLoading} />);
        items.push(<Pagination.Prev key="prev" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading} />);
        if (startPage > 1) items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
        for (let number = startPage; number <= endPage; number++) { items.push(<Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)} disabled={isLoading}>{number}</Pagination.Item>); }
        if (endPage < totalPages) items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
        items.push(<Pagination.Next key="next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || isLoading} />);
        items.push(<Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages || isLoading} />);
        return items;
    };
    // --- Fin Logique de Pagination ---

    // Helper pour formater date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
            return new Date(dateString).toLocaleDateString('fr-FR', options);
        } catch (e) { return dateString; }
    };

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-3">
                <Col><h1>Gestion des Certificats Émis</h1></Col>
                {/* Optionnel: Bouton retour dashboard admin */}
                <Col xs="auto">
                    <Button as={Link} to="/admin/dashboard" variant="outline-secondary">Tableau de Bord Admin</Button>
                </Col>
            </Row>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            {isLoading && !certificates.length && (
                <div className="text-center my-5"><Spinner animation="border" /></div>
            )}

            <Table striped bordered hover responsive className="mt-3">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Demandeur</th>
                        <th>Médecin Émetteur</th>
                        <th>N° Agrément</th>
                        <th>Date Émission</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {!isLoading && certificates.length === 0 && (
                        <tr><td colSpan="7" className="text-center text-muted">Aucun certificat trouvé.</td></tr>
                    )}
                    {certificates.map((cert) => (
                        <tr key={cert.certificate_id}>
                            <td>{cert.certificate_id}</td>
                            <td>{`${cert.applicant_last_name || ''}, ${cert.applicant_first_name || ''}`}</td>
                            <td>{cert.doctorName}</td>
                            <td>{cert.doctorAgrement}</td>
                            <td>{formatDate(cert.issue_date)}</td>
                            <td>
                                <span className={`badge bg-${cert.status === 'issued' ? 'primary' : 'secondary'}`}>
                                    {cert.status || 'N/A'}
                                </span>
                            </td>
                            <td>
                                {/* Lien vers la page de détails. On peut réutiliser la même page que le docteur */}
                                <Button
                                    variant="info"
                                    size="sm"
                                    as={Link}
                                    to={`/doctor/certificate/${cert.certificate_id}`} // Ou /admin/certificate/:id si route dédiée
                                >
                                    <i className="fas fa-eye"></i> Détails
                                </Button>
                                {/* Ajouter d'autres actions admin si besoin (ex: révoquer) */}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {totalPages > 1 && !isLoading && (
                <div className="d-flex justify-content-center">
                    <Pagination>{renderPaginationItems()}</Pagination>
                </div>
            )}
        </Container>
    );
};

export default AdminManageCertificatesPage;
