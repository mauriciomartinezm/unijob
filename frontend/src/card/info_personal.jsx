// src/componentes/info_personal.jsx
import React, { useState } from "react";
import { useUser } from "../context/UserContext.jsx";

export default function InfoPersonal({ form, handleChange }) {
  const { user, setUser } = useUser() || {};
  const [status, setStatus] = useState(null);

  const handleActualizar = async () => {
    setStatus({ saving: true });
    try {
      const id = (user && user.cedula) ? user.cedula : form.cedula;
      if (!id) {
        setStatus({ error: 'Falta cédula para identificar al estudiante' });
        return;
      }

      const payload = {
        nombre: form.nombre,
        telefono: form.telefono,
        ubicacion: form.ubicacion,
        cedula: form.cedula,
      };

      const resp = await fetch(`http://localhost:3001/api/updateEstudiante/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setStatus({ error: body.error || 'Error al actualizar perfil' });
        return;
      }

      // update provider if available
      try {
        if (setUser) {
          const newUser = {
            uri: body.sujeto || user?.uri || null,
            cedula: form.cedula || user?.cedula,
            nombre: form.nombre || user?.nombre,
            telefono: form.telefono || user?.telefono,
            ubicacion: form.ubicacion || user?.ubicacion,
          };
          setUser(newUser);
        }
      } catch (err) {
        console.warn('No se pudo actualizar provider:', err);
      }

      setStatus({ ok: true, message: body.mensaje || 'Perfil actualizado' });
    } catch (err) {
      console.error('Error updating profile:', err);
      setStatus({ error: 'Error de red al actualizar perfil' });
    }
  };

  return (
    <div className="tab-content">
      <div className="form-grid">
        <div>
          <label>Nombre Completo</label>
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Cedula</label>
          <input
            name="cedula"
            value={form.cedula}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Teléfono</label>
          <input
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Ubicación</label>
          <input
            name="ubicacion"
            value={form.ubicacion}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="btn-container">
        <button className="btn-actualizar" onClick={handleActualizar}>Actualizar perfil</button>
        {/* Mensajes movidos a modal overlay */}
      </div>

      {/* Overlay modal para estados */}
      {status && (status.saving || status.error || status.ok) && (
        <div className={`status-overlay ${status.saving ? 'saving' : status.error ? 'error' : 'ok'}`}> 
          <div className="status-box" role="alert">
            {status.saving && <p className="status-text">Guardando...</p>}
            {status.error && <p className="status-text">{status.error}</p>}
            {status.ok && <p className="status-text">{status.message}</p>}
            {(status.error || status.ok) && (
              <button className="status-close" onClick={() => setStatus(null)}>Cerrar</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
