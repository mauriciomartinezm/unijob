import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import '../css/csscomponentes/footer.css';
import logo2 from '../img/logo2.png';

export default function Footer() {
	const { user } = useUser() || {};
	const logged = !!user || localStorage.getItem('isLogged') === 'true';
	const year = new Date().getFullYear();

	return (
		<footer className="footer-root">
			<div className="footer-inner">
				{/* Logo */}
				<div className="footer-brand">
					<img src={logo2} alt="UniJob" className="footer-logo" />
					<p className="footer-tagline">Conectando talento con oportunidades impulsadas por IA.</p>
				</div>

				{/* Navigation */}
				<nav className="footer-nav" aria-label="Enlaces principales">
					<h4 className="footer-heading">Navegación</h4>
					<ul className="footer-links">
						<li><NavLink to="/" className="footer-link">Inicio</NavLink></li>
						{logged && <li><NavLink to="/perfil" className="footer-link">Mi Perfil</NavLink></li>}
						<li><NavLink to="/recomendaciones" className="footer-link">Recomendaciones</NavLink></li>
						{!logged && <li><NavLink to="/register" className="footer-link">Registrarse</NavLink></li>}
						{!logged && <li><NavLink to="/login" className="footer-link">Iniciar Sesión</NavLink></li>}
					</ul>
				</nav>

				{/* Info */}
				<div className="footer-info" aria-label="Información de contacto">
					<h4 className="footer-heading">Contacto</h4>
						<ul className="footer-links">
							<li><span className="footer-link muted">support@unijob.edu</span></li>
							<li><span className="footer-link muted">(+57) 000-0000</span></li>
							<li><span className="footer-link muted">malambo, Colombia</span></li>
						</ul>
				</div>
			</div>

			<div className="footer-bottom">
				<span className="footer-copy">© {year} UniJob. Todos los derechos reservados.</span>
				<div className="footer-legal">
					<NavLink to="#" className="footer-link small">Términos</NavLink>
					<NavLink to="#" className="footer-link small">Privacidad</NavLink>
				</div>
			</div>
		</footer>
	);
}

