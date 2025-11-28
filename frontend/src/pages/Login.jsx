import { useState } from "react";
import { useUser } from "../context/UserContext.jsx";
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import "../css/csspage/Login.css";
import equipo from "../img/trabajoeuquipo.jpg";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { setUser } = useUser();

  const handleLogin = async () => {
    setError('');
    try {
      const payload = { cedula: cedula, contrasena: password };
      const resp = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await resp.json().catch(() => ({}));
      console.log('Login response body:', body);
      if (!resp.ok) {
        setError(body.error || 'Credenciales inválidas');
        return;
      }
      // éxito
      const pick = (v) => Array.isArray(v) ? v[0] : (v || '');
      const profile = body.profile || {};
      const userObj = {
        uri: body.user || null,
        cedula: cedula,
        nombre: pick(profile.nombre),
        telefono: pick(profile.telefono),
        ubicacion: pick(profile.ubicacion),
      };
      console.log('Login successful, user:', body);
      if (setUser) setUser(userObj);
      localStorage.setItem('isLogged', 'true');
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('Error al conectar con el servidor');
    }
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

          <label className="login-label">Cedula o Nombre de Usuario</label>
          <div className="input-group">
            <Mail className="input-icon" />
            <input
              type="text"
              placeholder="Ingresa tu cedula o usuario"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
            />
          </div>

          <label className="login-label">Contraseña</label>
          <div className="input-group">
            <Lock className="input-icon" />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          {/* Mostrar mensajes de error (credenciales inválidas, usuario no registrado, etc.) */}
          {error && (
            <p className="login-error" role="alert" style={{ color: '#b00020', marginTop: '12px' }}>
              {error}
            </p>
          )}

          <p className="register-text">
            ¿No tienes una cuenta?{" "}
            <Link to="/register" className="register-link">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
