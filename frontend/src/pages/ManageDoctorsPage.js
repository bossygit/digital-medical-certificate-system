import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../services/admin.service';
import { Link } from 'react-router-dom'; // Keep if needed for future Edit/Details links
import { Container, Row, Col, Button, Table, Pagination, Spinner, Alert } from 'react-bootstrap'; // Import RB components

// TODO: Implement AddDoctorModal component
// import AddDoctorModal from './AddDoctorModal'; 

const ManageDoctorsPage = () => {
    const [doctors, setDoctors] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10); // Items per page
    // const [showAddModal, setShowAddModal] = useState(false); // State for Add Doctor Modal

    // Function to fetch doctors
    const fetchDoctors = useCallback(async (page) => {
        setIsLoading(true);
        setError('');
        try {
            const data = await adminService.listDoctors(page, limit);
            console.log("Data received from API:", data);
            setDoctors(data.doctors || []);
            setTotalPages(data.totalPages || 1);
            setCurrentPage(data.currentPage || 1);
        } catch (err) {
            setError(err.message || 'Échec du chargement des médecins.');
            setDoctors([]); // Clear doctors on error
        } finally {
            setIsLoading(false);
        }
    }, [limit]);

    // Fetch doctors on initial mount and when currentPage changes
    useEffect(() => {
        fetchDoctors(currentPage);
    }, [currentPage, fetchDoctors]);

    // Handler for changing doctor status
    const handleStatusChange = async (doctorUserId, currentStatus) => {
        const newStatus = !currentStatus;
        const confirmChange = window.confirm( // TODO: Replace with Modal confirmation
            `Êtes-vous sûr de vouloir ${newStatus ? 'activer' : 'suspendre'} ce médecin ?`
        );
        if (!confirmChange) return;

        // Consider a more granular loading state for the specific row/button later
        setIsLoading(true);
        setError('');
        try {
            await adminService.updateDoctorStatus(doctorUserId, newStatus);
            // Refresh the list by re-fetching the current page
            await fetchDoctors(currentPage);
        } catch (err) {
            setError(err.message || 'Échec de la mise à jour du statut.');
            // Keep loading false if fetch succeeds, reset only on error here
            setIsLoading(false);
        }
        // setIsLoading(false) is handled by fetchDoctors in the success case
    };

    // Pagination handlers
    const handlePageChange = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    // TODO: Implement Add Doctor Modal/Form
    const handleAddDoctor = () => {
        alert('Fonctionnalité Ajouter Médecin non implémentée. (Modal à venir)');
        // setShowAddModal(true); // Open the modal
    };

    // Function to render pagination items
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
                    <h1>Gérer les Médecins Agréés</h1>
                </Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={handleAddDoctor} disabled={isLoading}> {/* TODO: Connect to Modal */}
                        Ajouter Médecin
                    </Button>
                </Col>
            </Row>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            {isLoading && !doctors.length && ( // Show spinner only if loading and no doctors are displayed yet
                <div className="text-center my-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </Spinner>
                </div>
            )}

            <Table striped bordered hover responsive className="mt-3">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>N° Agrément</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {!isLoading && doctors.length === 0 && (
                        <tr>
                            <td colSpan="5" className="text-center text-muted">Aucun médecin trouvé.</td>
                        </tr>
                    )}
                    {doctors.map((doctor) => (
                        <tr key={doctor.user_id}>
                            <td>{`${doctor.last_name || ''} ${doctor.first_name || ''}`}</td>
                            <td>{doctor.email}</td>
                            <td>{doctor.doctorProfile?.agrement_number || 'N/A'}</td>
                            <td>
                                <span className={`badge bg-${doctor.is_active ? 'success' : 'secondary'}`}>
                                    {doctor.is_active ? 'Actif' : 'Suspendu'}
                                </span>
                            </td>
                            <td>
                                <Button
                                    variant={doctor.is_active ? 'warning' : 'success'}
                                    size="sm"
                                    onClick={() => handleStatusChange(doctor.user_id, doctor.is_active)}
                                    disabled={isLoading} // Disable button during general loading state
                                >
                                    {doctor.is_active ? 'Suspendre' : 'Activer'}
                                </Button>
                                {/* TODO: Add Edit/Details buttons/links here */}
                                {/* <Button variant="info" size="sm" as={Link} to={`/admin/doctors/${doctor.user_id}`} className="ms-1">Détails</Button> */}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && !isLoading && (
                <div className="d-flex justify-content-center">
                    <Pagination>{renderPaginationItems()}</Pagination>
                </div>
            )}

            {/* TODO: Render Add Doctor Modal */}
            {/* <AddDoctorModal show={showAddModal} handleClose={() => setShowAddModal(false)} onDoctorAdded={() => fetchDoctors(currentPage)} /> */}
        </Container>
    );
};

export default ManageDoctorsPage; 