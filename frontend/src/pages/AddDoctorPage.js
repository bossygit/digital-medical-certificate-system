import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert, Card, Spinner, Row, Col } from 'react-bootstrap';
import adminService from '../services/admin.service';

const AddDoctorPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        agrement_number: '',
        specialty: '',
        phone_number: '',
        office_address: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        // Simple validation frontend (peut être améliorée)
        if (!formData.email || !formData.first_name || !formData.last_name || !formData.agrement_number) {
            setError('Email, Prénom, Nom, et Numéro d\'agrément sont requis.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await adminService.addDoctor(formData);
            setSuccess(response.message || 'Docteur ajouté avec succès !');
            // Optionnel : Réinitialiser le formulaire
            setFormData({
                email: '', first_name: '', last_name: '', agrement_number: '',
                specialty: '', phone_number: '', office_address: ''
            });
            // Optionnel : Rediriger vers la liste des docteurs après un délai
            // setTimeout(() => navigate('/admin/doctors'), 2000);

        } catch (err) {
            setError(err.message || 'Erreur lors de l\'ajout du docteur.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container className="mt-4">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card>
                        <Card.Header as="h4">Ajouter un Nouveau Médecin</Card.Header>
                        <Card.Body>
                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="formDoctorEmail">
                                    <Form.Label>Email *</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="Entrez l'email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        disabled={isLoading}
                                    />
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="formDoctorFirstName">
                                            <Form.Label>Prénom *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Prénom"
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={handleChange}
                                                required
                                                disabled={isLoading}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="formDoctorLastName">
                                            <Form.Label>Nom *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Nom"
                                                name="last_name"
                                                value={formData.last_name}
                                                onChange={handleChange}
                                                required
                                                disabled={isLoading}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3" controlId="formDoctorAgrement">
                                    <Form.Label>N° Agrément *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Numéro d'agrément"
                                        name="agrement_number"
                                        value={formData.agrement_number}
                                        onChange={handleChange}
                                        required
                                        disabled={isLoading}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formDoctorSpecialty">
                                    <Form.Label>Spécialité</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Spécialité (optionnel)"
                                        name="specialty"
                                        value={formData.specialty}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formDoctorPhone">
                                    <Form.Label>Téléphone</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        placeholder="Téléphone (optionnel)"
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formDoctorAddress">
                                    <Form.Label>Adresse du Cabinet</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Adresse (optionnel)"
                                        name="office_address"
                                        value={formData.office_address}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                    />
                                </Form.Group>

                                <Button variant="primary" type="submit" disabled={isLoading} className="w-100">
                                    {isLoading ? (
                                        <><Spinner as="span" animation="border" size="sm" /> Ajout en cours...</>
                                    ) : (
                                        'Ajouter le Médecin'
                                    )}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AddDoctorPage;
