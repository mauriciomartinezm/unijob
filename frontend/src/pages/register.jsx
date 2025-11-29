
import { useState } from "react";
import { useUser } from "../context/UserContext.jsx";
import { IdCard, Lock, Eye, EyeOff, User } from "lucide-react";
import "../css/csspage/register.css";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    password: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const validateCedula = (cedula) => {
    // simple non-empty validation; adapt if you want numeric-only or specific format
    return /\S+/.test(cedula);
  };

  const { setUser } = useUser();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError("Por favor ingresa nombre y apellido.");
      return;
    }
    if (!validateCedula(form.cedula)) {
      setError("Por favor ingresa una cedula válida.");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    // Enviar al backend
    try {
      const payload = {
        cedula: form.cedula,
        contrasena: form.password,
        nombre: `${form.nombre} ${form.apellido}`,
      };
      console.log('Register payload:', payload);
      const resp = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setError(body.error || body.message || 'Error en registro');
        return;
      }

      // éxito: persistir en provider
      const userObj = {
        uri: body.user || null,
        cedula: form.cedula,
        nombre: `${form.nombre} ${form.apellido}`,
      };
      if (setUser) setUser(userObj);
      localStorage.setItem('isLogged', 'true');
      navigate('/');
    } catch (err) {
      console.error('Register error:', err);
      setError('Ocurrió un error al registrar el usuario.');
    }
  };

  return (
    <div className="register-container">
      <div className="register-card" role="form">
        <header className="register-header">
          <h1 className="register-title">Crear Cuenta</h1>
          <p className="register-subtitle">Regístrate para comenzar</p>
        </header>

        {error && <p className="register-error">{error}</p>}

        <label className="register-label">Nombre</label>
        <div className="register-input-group">
          <User className="register-icon" />
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            type="text"
            placeholder="Ingresa tu nombre"
            className="register-input"
          />
        </div>

        <label className="register-label">Apellido</label>
        <div className="register-input-group">
          <User className="register-icon" />
          <input
            name="apellido"
            value={form.apellido}
            onChange={handleChange}
            type="text"
            placeholder="Ingresa tu apellido"
            className="register-input"
          />
        </div>

        <label className="register-label">Cedula</label>
        <div className="register-input-group">
          <IdCard className="register-icon" />
          <input
            name="cedula"
            value={form.cedula}
            onChange={handleChange}
            type="text"
            placeholder="Ingresa tu cedula"
            className="register-input"
          />
        </div>

        <label className="register-label">Contraseña</label>
        <div className="register-input-group">
          <Lock className="register-icon" />
          <input
            name="password"
            value={form.password}
            onChange={handleChange}
            type={showPassword ? "text" : "password"}
            placeholder="Ingresa tu contraseña"
            className="register-input"
          />
          {showPassword ? (
            <EyeOff
              className="register-icon-right"
              onClick={() => setShowPassword(false)}
            />
          ) : (
            <Eye
              className="register-icon-right"
              onClick={() => setShowPassword(true)}
            />
          )}
        </div>

        <label className="register-label">Confirmar Contraseña</label>
        <div className="register-input-group">
          <Lock className="register-icon" />
          <input
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            type={showPassword ? "text" : "password"}
            placeholder="Confirma tu contraseña"
            className="register-input"
          />
        </div>

        <button className="register-btnr" onClick={handleRegister}>
          Registrarse
        </button>

        <p className="register-text">
          ¿Ya tienes una cuenta?{' '}
          <a href="#" className="register-link" onClick={() => navigate('/login')}>
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}
