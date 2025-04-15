import React, { useState, useEffect, useCallback } from 'react';
import certificateService from '../services/certificate.service';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button, Table, Pagination, Spinner, Alert } from 'react-bootstrap'; // Import RB components

const DoctorHistoryPage = () => {
    const [certificates, setCertificates] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10); // Items per page

    // Function to fetch certificate history
    const fetchHistory = useCallback(async (page) => {
        setIsLoading(true);
        setError('');
        try {
            const data = await certificateService.getDoctorHistory(page, limit);
            setCertificates(data.certificates || []);
            setTotalPages(data.totalPages || 1);
            setCurrentPage(data.currentPage || 1);
        } catch (err) {
            setError(err.message || 'Échec du chargement de l\'historique.');
            setCertificates([]); // Clear history on error
        } finally {
            setIsLoading(false);
        }
    }, [limit]);

    // Fetch history on initial mount and when currentPage changes
    useEffect(() => {
        fetchHistory(currentPage);
    }, [currentPage, fetchHistory]);

    // Pagination handlers
    const handlePageChange = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            // Use options for better formatting
            const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
            return new Date(dateString).toLocaleDateString('fr-FR', options);
        } catch (e) {
            console.error("Error formatting date:", e);
            return dateString; // Return original string if formatting fails
        }
    };

    // Function to render pagination items (same as ManageDoctorsPage)
    const renderPaginationItems = () => {
        let items = [];
        const maxPagesToShow = 5; // Adjust as needed
        let startPage, endPage;

        if (totalPages <= maxPagesToShow) {
            startPage = 1;
            endPage = totalPages;
        } else {
            if (currentPage <= Math.ceil(maxPagesToShow / 2)) {
                startPage = 1;
                endPage = maxPagesToShow;
            } else if (currentPage + Math.floor(maxPagesToShow / 2) >= totalPages) {
                startPage = totalPages - maxPagesToShow + 1;
                endPage = totalPages;
            } else {
                startPage = currentPage - Math.floor(maxPagesToShow / 2);
                endPage = currentPage + Math.floor(maxPagesToShow / 2);
            }
        }

        items.push(
            <Pagination.First key="first" onClick={() => handlePageChange(1)} disabled={currentPage === 1 || isLoading} />
        );
        items.push(
            <Pagination.Prev key="prev" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading} />
        );

        if (startPage > 1) {
            items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
        }

        for (let number = startPage; number <= endPage; number++) {
            items.push(
                <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)} disabled={isLoading}>
                    {number}
                </Pagination.Item>
            );
        }

        if (endPage < totalPages) {
            items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
        }

        items.push(
            <Pagination.Next key="next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || isLoading} />
        );
        items.push(
            <Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages || isLoading} />
        );

        return items;
    };


    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-3">
                <Col>
                    <h1>Historique des Certificats Émis</h1>
                </Col>
                <Col xs="auto">
                    <Button as={Link} to="/doctor/dashboard" variant="outline-secondary">Retour au Tableau de Bord</Button>
                </Col>
            </Row>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            {isLoading && !certificates.length && (
                <div className="text-center my-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </Spinner>
                </div>
            )}

            <Table striped bordered hover responsive className="mt-3">
                <thead>
                    <tr>
                        <th>ID Certificat</th>
                        <th>Demandeur</th>
                        <th>Date Émission</th>
                        <th>Date Expiration</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {!isLoading && certificates.length === 0 && (
                        <tr>
                            <td colSpan="5" className="text-center text-muted">Aucun certificat trouvé dans l'historique.</td>
                        </tr>
                    )}
                    {certificates.map((cert) => (
                        <tr key={cert.certificate_id}>
                            <td>{cert.certificate_id}</td>
                            <td>{`${cert.applicant_last_name || ''}, ${cert.applicant_first_name || ''}`}</td>
                            <td>{formatDate(cert.issue_date)}</td>
                            <td>{cert.expiry_date ? formatDate(cert.expiry_date) : 'N/A'}</td>
                            <td>
                                <span className={`badge bg-${cert.status === 'issued' ? 'primary' : 'secondary'}`}>
                                    {cert.status || 'N/A'}
                                </span>
                            </td>
                            <td>
                                <Button
                                    variant="info"
                                    size="sm"
                                    as={Link}
                                    to={`/doctor/certificate/${cert.certificate_id}`}
                                >
                                    <i className="fas fa-eye"></i> Détails
                                </Button>
                            </td>
                        </tr>
                    ))};
                </tbody>
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && !isLoading && (
                <div className="d-flex justify-content-center">
                    <Pagination>{renderPaginationItems()}</Pagination>
                </div>
            )}
        </Container>
    );
};

export default DoctorHistoryPage; 