import React from "react";
import { Link } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";
import { FaHome, FaLaptopCode, FaRobot, FaSignOutAlt } from "react-icons/fa"; // Ajout de l'icône Chatbot
import { FaChartLine } from "react-icons/fa";
import "./header.css";

const Header = () => {
    const handleLogout = () => {
        localStorage.removeItem("token");
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg" fixed="top" className="custom-navbar">
            <Container fluid>
                {/* LOGO BIEN COLLÉ À GAUCHE */}
                <Navbar.Brand as={Link} to="/dashboard" className="logo me-auto">
                    AKKA RRYZM
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
                            <FaChartLine className="icon-top" /> <span>Simulation</span>
                        </Nav.Link>


                        {/* Chatbot IA */}
                        <Nav.Link as={Link} to="/chatbot" className="nav-link">
                            <FaRobot className="icon-top" /> <span>Chatbot IA</span>
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
