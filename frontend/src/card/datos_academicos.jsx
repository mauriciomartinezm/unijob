import "../css/csscard/datos_academicos.css";
import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext.jsx";
import { useNavigate } from "react-router-dom";

export default function DatosAcademicos({
  academicos,
  handleAcademicosChange,
  handleCheckbox,
}) {
  const { user } = useUser() || {};
  const [status, setStatus] = useState(null);
  const [carreras, setCarreras] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const resp = await fetch('http://localhost:3001/api/getCarreras');
        if (!resp.ok) return;
        const rows = await resp.json().catch(() => []);
        // rows expected: [{ uri, propiedades: { nombreCarrera: ["..."] } }, ...]
        const list = (Array.isArray(rows) ? rows : []).map(r => {
          const uri = r.uri || '';
          const fragment = uri.split(/[#\/]/).pop();
          const label = (r.propiedades && (r.propiedades.nombreCarrera || r.propiedades.nombre) && (r.propiedades.nombreCarrera || r.propiedades.nombre)[0]) || fragment;
          return { value: fragment, label };
        });
        if (mounted) setCarreras(list);
      } catch (err) {
        console.error('Error loading carreras:', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleGuardar = async () => {
    setStatus('loading');
    try {
      if (!user || !user.cedula) {
        setStatus('no-user');
        return;
      }

      const cedula = user.cedula;
      const payload = {
        nombre: academicos.nombre || undefined,
        carrera: academicos.carrera || undefined,
        universidad: academicos.universidad || undefined,
        semestre: academicos.semestre || undefined,
        promedio: academicos.promedio || undefined,
      };

      const resp = await fetch(`http://localhost:3001/api/updateEstudiante/${encodeURIComponent(cedula)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setStatus({ error: body.error || body.message || 'Error al actualizar' });
        return;
      }

      setStatus({ ok: true, message: body.mensaje || 'Actualizado' });
      // navigate or refresh profile page if desired
      // navigate('/perfil');
    } catch (err) {
      console.error('Error updating academicos:', err);
      setStatus({ error: 'Error al conectar con el servidor' });
    }
  };
  return (
    <div className="tab-content">

      <h2>Datos académicos y preferencias</h2>

      {/* INFORMACIÓN ACADÉMICA */}
      <h3 className="section-title">Información Académica</h3>

      <div className="form-grid">
        <div>
          <label>Universidad</label>
          <input
            name="universidad"
            value={academicos.universidad}
            onChange={handleAcademicosChange}
          />
        </div>

        <div>
          <label>Carrera</label>
          <select
            name="carrera"
            value={academicos.carrera}
            onChange={handleAcademicosChange}
            className="input-small select-input"
          >
            <option value="">-- Selecciona una carrera --</option>
            {carreras.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Semestre</label>
          <input
            name="semestre"
            value={academicos.semestre}
            onChange={handleAcademicosChange}
          />
        </div>

        <div>
          <label>Promedio (GPA)</label>
          <input
            name="promedio"
            value={academicos.promedio}
            onChange={handleAcademicosChange}
          />
        </div>
      </div>
      
      <div className="btn-container">
        <button className="btn-actualizar" onClick={handleGuardar}>
          Guardar Cambios
        </button>
        {/* mensajes movidos al modal overlay */}
      </div>

      {(status === 'loading' || status === 'no-user' || (status && (status.error || status.ok))) && (
        <div className={`status-overlay ${status === 'loading' ? 'saving' : ''}`}> 
          <div className="status-box" role="alert">
            {status === 'loading' && <p className="status-text">Guardando...</p>}
            {status === 'no-user' && <p className="status-text">Debes iniciar sesión para actualizar.</p>}
            {status && status.error && <p className="status-text">{status.error}</p>}
            {status && status.ok && <p className="status-text">{status.message}</p>}
            {status !== 'loading' && (
              <button className="status-close" onClick={() => setStatus(null)}>Cerrar</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
