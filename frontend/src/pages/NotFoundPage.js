import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Alert } from 'react-bootstrap';

const NotFoundPage = () => {
    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Alert variant="warning" className="text-center">
                        <Alert.Heading>Erreur 404 - Page Non Trouvée</Alert.Heading>
                        <p>
                            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
                        </p>
                        <hr />
                        <p className="mb-0">
                            <Link to="/" className="alert-link">Retourner à la page d'accueil</Link>
                            {' ou '}
                            <Link to="/login" className="alert-link">Retourner à la page de connexion</Link>
                        </p>
                    </Alert>
                </Col>
            </Row>
        </Container>
    );
};

export default NotFoundPage;