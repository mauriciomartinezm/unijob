import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "../css/csscomponentes/nav.css";
import { Bell } from "lucide-react";
import logo from "../img/logo.png";

export default function Navbar() {
  const [isLogged, setIsLogged] = useState(false);

  // Cargar estado desde localStorage al iniciar
  useEffect(() => {
    const saved = localStorage.getItem("isLogged");
    setIsLogged(saved === "false");
  }, []);

  return (
    <nav className="navbar">

      {/* IZQUIERDA: LOGO */}
      <div className="nav-left">
        <img src={logo} alt="UniJob" className="logo" />
      </div>

      {/* CENTRO: LINKS PRINCIPALES */}
      <div className="nav-center">
        <NavLink to="/" className="nav-item">Inicio</NavLink>
        <NavLink to="/perfil" className="nav-item">Mi perfil</NavLink>
        <NavLink to="/recomendaciones" className="nav-item">Recomendaciones</NavLink>
      </div>

      {/* DERECHA: LOGIN o ICONOS */}
      <div className="nav-right">
        {!isLogged ? (
          <>
            <NavLink to="/login" className="nav-item">Iniciar sesión</NavLink>
            <NavLink to="/registro" className="nav-item register-btn">Comenzar</NavLink>
          </>
        ) : (
          <>
            <Bell className="icon" />
            <div className="user-circle user-circle-blue"></div>
          </>
        )}
      </div>

    </nav>
  );
}
