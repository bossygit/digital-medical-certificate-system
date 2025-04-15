import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, Nav, Container, Button } from 'react-bootstrap'; // Import React-Bootstrap components

// Basic Navbar styling
const styles = {
    navbar: {
        backgroundColor: '#f8f9fa',
        padding: '10px 20px',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    brand: {
        fontSize: '1.2em',
        fontWeight: 'bold',
        textDecoration: 'none',
        color: '#333'
    },
    navLinks: {
        listStyle: 'none',
        display: 'flex',
        margin: 0,
        padding: 0
    },
    navItem: {
        marginLeft: '15px'
    },
    navLink: {
        textDecoration: 'none',
        color: '#007bff',
        paddingBottom: '3px' // Space for active style border
    },
    navLinkActive: {
        fontWeight: 'bold',
        borderBottom: '2px solid #007bff'
    },
    userInfo: {
        marginLeft: '15px',
        fontStyle: 'italic',
        color: '#555'
    },
    logoutButton: {
        marginLeft: '15px',
        padding: '5px 10px',
        cursor: 'pointer',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '3px'
    }
};

const AppNavbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login'); // Redirect to login after logout
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg">
            <Container>
                <Navbar.Brand as={Link} to="/">CertiMed</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {/* Public links */}
                        <Nav.Link as={Link} to="/verification">Vérifier Certificat</Nav.Link>

                        {/* Conditional Links based on user role */}
                        {user?.role === 'doctor' && (
                            <Nav.Link as={Link} to="/doctor/dashboard">Tableau de Bord</Nav.Link>
                        )}
                        {user?.role === 'admin' && (
                            <Nav.Link as={Link} to="/admin/dashboard">Tableau de Bord Admin</Nav.Link>
                        )}
                    </Nav>
                    <Nav>
                        {user ? (
                            <Button variant="outline-light" onClick={handleLogout}>Déconnexion</Button>
                        ) : (
                            <Nav.Link as={Link} to="/login">Connexion</Nav.Link>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default AppNavbar; 