import React from "react";
import { Link } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";
import { FaHome, FaLaptopCode, FaSignOutAlt } from "react-icons/fa"; // Icônes ajustées
import "./header.css";

const Header = () => {
    const handleLogout = () => {
        localStorage.removeItem("token");
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg" fixed="top" className="custom-navbar">
            <Container fluid> {/* UTILISATION DE "fluid" POUR ÉVITER LES MARGES */}
                {/* LOGO BIEN COLLÉ À GAUCHE */}
                <Navbar.Brand as={Link} to="/dashboard" className="logo me-auto">
                    AKKA FLOW
                </Navbar.Brand>

                {/* MENU BURGER POUR MOBILE */}
                <Navbar.Toggle aria-controls="basic-navbar-nav" />

                {/* NAVIGATION CENTRÉE */}
                <Navbar.Collapse id="basic-navbar-nav" className="justify-content-center">
                    <Nav className="nav-links">
                        {/* Dashboard */}
                        <Nav.Link as={Link} to="/dashboard" className="nav-link">
                            <FaHome className="icon-top" /> <span>Dashboard</span>
                        </Nav.Link>

                        {/* Simulation */}
                        <Nav.Link as={Link} to="/simulation" className="nav-link">
                            <FaLaptopCode className="icon-top" /> <span>Simulation</span>
                        </Nav.Link>

                        {/* Déconnexion */}
                        <Nav.Link as={Link} to="/login" className="logout-link" onClick={handleLogout}>
                            <FaSignOutAlt className="icon-left" /> Déconnexion
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Header;
