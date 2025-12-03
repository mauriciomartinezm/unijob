import "../css/csscard/preferencias.css";
import { useState } from "react";
import { useUser } from "../context/UserContext.jsx";
import ciudades from "../data/ciudades_colombia.json";

export default function Preferencias({
  preferencias,
  handlePreferenciasChange,
}) {
  const { user } = useUser() || {};
  const [status, setStatus] = useState(null);
  const [ubicaciones] = useState(ciudades || []);

  const handleGuardar = async () => {
    setStatus(null);
    if (!user || !user.cedula) {
      setStatus({ error: 'Debes iniciar sesión para guardar preferencias' });
      return;
    }

  // Build payload; include ubicacion and salario even if empty so backend can delete
  // those preferences when the user clears the fields.
  const payload = { cedula: user.cedula };
  if (typeof preferencias.modalidad !== 'undefined' && String(preferencias.modalidad).trim() !== '') payload.modalidad = preferencias.modalidad;
  if (typeof preferencias.salario !== 'undefined') payload.salario = preferencias.salario;
  if (typeof preferencias.ubicacion !== 'undefined') payload.ubicacion = preferencias.ubicacion;

    // If only cedula present, nothing to do
    if (Object.keys(payload).length <= 1) {
      setStatus({ error: 'No hay cambios para guardar' });
      return;
    }

    setStatus({ saving: true });
    try {
      const resp = await fetch('http://localhost:3001/api/preferencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setStatus({ error: body.error || 'Error al guardar preferencias' });
        return;
      }
      setStatus({ ok: true, message: body.message || 'Preferencias guardadas' });
    } catch (err) {
      console.error('Error saving preferencias:', err);
      setStatus({ error: 'Error de red al guardar preferencias' });
    }
  };

  return (
    <div className="tab-content">
      <h2>Preferencias de Prácticas</h2>

      {/* MODALIDAD */}
      <div className="form-section">
        <h3 className="section-title">Modalidad</h3>

        <select
          name="modalidad"
          value={preferencias.modalidad}
          onChange={handlePreferenciasChange}
          className="input-small select-input"
        >
          <option value="">Seleccione una opción</option>
          <option value="presencial">Presencial</option>
          <option value="virtual">Virtual</option>
          <option value="mixta">Mixta</option>
        </select>
      </div>

      {/* SALARIO */}
      <div className="form-section">
        <h3 className="section-title">Salario</h3>
        <input
          name="salario"
          value={preferencias.salario}
          onChange={handlePreferenciasChange}
          className="input-small"
        />
      </div>

      {/* UBICACIÓN */}
      <div className="form-section">
        <h3 className="section-title">Ubicación</h3>
        <select
          name="ubicacion"
          value={preferencias.ubicacion}
          onChange={handlePreferenciasChange}
          className="input-small select-input"
        >
          <option value="">Seleccione una ubicación</option>
          {ubicaciones.map((u, i) => (
            <option key={i} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {/* BOTÓN */}
      <div className="btn-container">
        <button className="btn-actualizar" onClick={handleGuardar}>Guardar Cambios</button>
      </div>

      {(status && (status.saving || status.error || status.ok)) && (
        <div className={`status-overlay ${status.saving ? 'saving' : ''}`}> 
          <div className="status-box" role="alert">
            {status.saving && <p className="status-text">Guardando...</p>}
            {status.error && <p className="status-text">{status.error}</p>}
            {status.ok && <p className="status-text">{status.message}</p>}
            {!status.saving && (
              <button className="status-close" onClick={() => setStatus(null)}>Cerrar</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
