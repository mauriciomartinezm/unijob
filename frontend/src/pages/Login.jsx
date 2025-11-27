import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import "../css/csspage/Login.css";
import equipo from "../img/trabajoeuquipo.jpg";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    // Guardar en "base de datos temporal"
    localStorage.setItem("isLogged", "false");

    // Redirigir al inicio
    navigate("/");
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img src={equipo} alt="UniJob" className="login-left-img" />

        <div className="login-left-text">
          <h1 className="login-logo">
            <span className="logo-icon"></span> UniJob
          </h1>

          <h2>Tu Carrera Empieza Aquí.</h2>
          <p>Conectando Talento con Oportunidad.</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-box">
          <h2>Bienvenido de Nuevo</h2>
          <p className="login-subtitle">Inicia sesión en tu cuenta</p>

          <label className="login-label">Correo o Nombre de Usuario</label>
          <div className="input-group">
            <Mail className="input-icon" />
            <input type="text" placeholder="Ingresa tu correo o usuario" />
          </div>

          <label className="login-label">Contraseña</label>
          <div className="input-group">
            <Lock className="input-icon" />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Ingresa tu contraseña"
            />

            {showPassword ? (
              <EyeOff
                className="input-icon-right"
                onClick={() => setShowPassword(false)}
              />
            ) : (
              <Eye
                className="input-icon-right"
                onClick={() => setShowPassword(true)}
              />
            )}
          </div>

          <div className="remember-row">
            <label>
              <input type="checkbox" /> Recuérdame
            </label>
            <a href="#" className="forgot-link">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button className="login-btn" onClick={handleLogin}>
            Iniciar Sesión
          </button>

          <p className="register-text">
            ¿No tienes una cuenta?{" "}
            <a href="#" className="register-link">
              Regístrate aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
