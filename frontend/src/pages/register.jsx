
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import "../css/csspage/register.css";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError("");

    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError("Por favor ingresa nombre y apellido.");
      return;
    }
    if (!validateEmail(form.email)) {
      setError("Por favor ingresa un email válido.");
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

    // Guardar en localStorage (simulación de base de datos local)
    try {
      const usersJson = localStorage.getItem("users") || "[]";
      const users = JSON.parse(usersJson);
      // opcional: comprobar que no exista el email
      const exists = users.find((u) => u.email === form.email);
      if (exists) {
        setError("Ya existe una cuenta con ese correo.");
        return;
      }

      const newUser = {
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        password: form.password,
      };

      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
      // marcar como no logueado por defecto o cambiar según la lógica deseada
      localStorage.setItem("isLogged", "true");

      // redirigir al inicio
      navigate("/");
    } catch (err) {
      setError("Ocurrió un error al guardar el usuario.");
      console.error(err);
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

        <label className="register-label">Correo</label>
        <div className="register-input-group">
          <Mail className="register-icon" />
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            type="email"
            placeholder="Ingresa tu correo"
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
