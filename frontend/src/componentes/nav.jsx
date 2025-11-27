import { useEffect, useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import "../css/csscomponentes/nav.css";
import { Bell, Menu, X } from "lucide-react";
import logo2 from "../img/logo2.png";
import { useUser } from "../context/UserContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const [isLogged, setIsLogged] = useState(false);
  const [showMenu, setShowMenu] = useState(false); // avatar dropdown
  const [mobileOpen, setMobileOpen] = useState(false); // mobile nav
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useUser() || {};

  // Cargar estado desde localStorage al iniciar
  useEffect(() => {
    const saved = localStorage.getItem("isLogged");
    setIsLogged(saved === "true");
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleLogout = () => {
    try {
      if (logout) logout();
    } catch (err) {
      console.error('Logout error', err);
    }
    setIsLogged(false);
    setShowMenu(false);
    navigate('/login');
  };

  return (
    <nav className={`navbar ${mobileOpen ? 'mobile-open' : ''}`}>

      {/* IZQUIERDA: LOGO */}
      <div className="nav-left">
        <img src={logo2} alt="UniJob" className="logo" />
      </div>

      {/* CENTRO: LINKS PRINCIPALES */}
      <div className="nav-center">
        <NavLink to="/" className="nav-item">Inicio</NavLink>
        <NavLink to="/perfil" className="nav-item">Mi perfil</NavLink>
        <NavLink to="/recomendaciones" className="nav-item">Recomendaciones</NavLink>
      </div>

      {/* TOGGLE MOBILE */}
      <button
        className="nav-toggle"
        aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(o => !o)}
      >
        {mobileOpen ? <X size={26} /> : <Menu size={26} />}
      </button>

      {/* DERECHA: LOGIN o ICONOS */}
      <div className="nav-right">
        {!isLogged ? (
          <>
            <NavLink to="/login" className="nav-item">Iniciar sesión</NavLink>
            <NavLink to="/register" className="nav-item register-btn">Comenzar</NavLink>
          </>
        ) : (
          <>
            <Bell className="icon" />
            <div style={{ position: 'relative' }} ref={menuRef}>
              <div
                className="user-circle user-circle-blue"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((s) => !s);
                }}
              ></div>
              {showMenu && (
                <div className="user-menu">
                  <button className="user-menu-item" onClick={handleLogout}>Cerrar sesión</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* MOBILE SLIDE MENU */}
      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}> 
        <div className="mobile-links">
          <NavLink onClick={() => setMobileOpen(false)} to="/" className="nav-item">Inicio</NavLink>
          <NavLink onClick={() => setMobileOpen(false)} to="/perfil" className="nav-item">Mi perfil</NavLink>
          <NavLink onClick={() => setMobileOpen(false)} to="/recomendaciones" className="nav-item">Recomendaciones</NavLink>
          {!isLogged ? (
            <>
              <NavLink onClick={() => setMobileOpen(false)} to="/login" className="nav-item">Iniciar sesión</NavLink>
              <NavLink onClick={() => setMobileOpen(false)} to="/register" className="nav-item register-btn">Comenzar</NavLink>
            </>
          ) : (
            <button className="nav-item logout-btn" onClick={() => { handleLogout(); setMobileOpen(false); }}>Cerrar sesión</button>
          )}
        </div>
      </div>

    </nav>
  );
}
