import "../css/csscard/competencias.css";
import { Plus, Edit3, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext.jsx";

export default function MisCompetencias({ competencias, onUpdated }) {
  const [localList, setLocalList] = useState(competencias?.lista || []);
  const [showModal, setShowModal] = useState(false);
  const [available, setAvailable] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [status, setStatus] = useState(null);
  const { user } = useUser() || {};

  useEffect(() => {
    // load available competencias from API
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch('http://localhost:3001/api/getCompetencias');
        if (!resp.ok) return;
        const rows = await resp.json().catch(() => []);
        const list = (Array.isArray(rows) ? rows : rows || []).map(r => {
          const uri = r.uri || '';
          const frag = uri.split(/[#\\/]/).pop();
          const label = (r.propiedades && (r.propiedades.nombreCompetencia || r.propiedades.nombre) && (r.propiedades.nombreCompetencia || r.propiedades.nombre)[0]) || frag;
          return { value: frag, label };
        });
        if (mounted) setAvailable(list);
      } catch (err) {
        console.error('Error loading competencias', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // respond to prop changes (e.g., loaded from backend)
  useEffect(() => {
    // normalize incoming competencias to include frag when possible
    const incoming = competencias?.lista || [];
    const norm = incoming.map((c) => {
      // if already has frag, keep it
      if (c.frag) return c;
      // try to match with available by label
      const found = available.find(a => a.label === c.nombre);
      if (found) return { ...c, frag: found.value };
      // otherwise derive frag from name
      const frag = (c.nombre || '').replace(/[^a-zA-Z0-9_\-]/g, '_');
      return { ...c, frag };
    });
    setLocalList(norm);
  }, [competencias, available]);

  useEffect(() => {
    // reset selection when modal opens
    if (showModal) {
      const s = new Set(localList.map(c => c.frag || ((c.nombre || '').replace(/[^a-zA-Z0-9_\-]/g, '_'))));
      setSelected(s);
    }
  }, [showModal, localList]);

  const toggleSelect = (val) => {
    setSelected(s => {
      const copy = new Set(s);
      if (copy.has(val)) copy.delete(val);
      else copy.add(val);
      return copy;
    });
  };

  const addSelected = async () => {
    // Persist via backend: PUT updateEstudiante/:cedula with competencias array
    if (!user || !user.cedula) {
      setStatus({ error: 'Debes iniciar sesión para añadir competencias' });
      return;
    }
    setStatus({ saving: true });
    try {
      // merge selected with existing fragments
      const currentFrags = localList.map(c => c.frag || ((c.nombre || '').replace(/[^a-zA-Z0-9_\-]/g, '_')));
      const union = new Set(currentFrags.concat(Array.from(selected)));
      const competenciasArray = Array.from(union);
      const resp = await fetch(`http://localhost:3001/api/updateEstudiante/${encodeURIComponent(user.cedula)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competencias: competenciasArray }),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setStatus({ error: body.error || 'Error al persistir competencias' });
        return;
      }
      // refresh from server to ensure canonical state
      await refreshLocalFromServer();
      setShowModal(false);
      setStatus({ ok: true });
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('Error adding competencias:', err);
      setStatus({ error: 'Error de red al añadir competencias' });
    }
  };

  const refreshLocalFromServer = async () => {
    if (!user || !user.cedula) return;
    try {
      const resp = await fetch(`http://localhost:3001/api/getEstudiante/${encodeURIComponent(user.cedula)}`);
      if (!resp.ok) return;
      const stu = await resp.json().catch(() => ({}));
      const posee = (stu.propiedades && stu.propiedades.poseeCompetencia) ? stu.propiedades.poseeCompetencia : [];
      const newLocal = [];
      for (const p of posee) {
        const frag = (p || '').split(/[#\\/]/).pop();
        const found = available.find(a => a.value === frag);
        const label = found ? found.label : (frag || '').replace(/_/g, ' ');
        newLocal.push({ nombre: label, categoria: '', frag });
      }
      setLocalList(newLocal);
    } catch (err) {
      console.error('Error refreshing competencias from server:', err);
    }
  };

  const removeCompetencia = async (idx) => {
    if (!user || !user.cedula) {
      setStatus({ error: 'Debes iniciar sesión para eliminar competencias' });
      return;
    }
    const comp = localList[idx];
    if (!comp) return;
    const ok = window.confirm(`¿Eliminar competencia "${comp.nombre}"?`);
    if (!ok) return;

    // derive fragments for current local list
    const fragments = localList.map(c => c.frag || ((c.nombre || '').replace(/[^a-zA-Z0-9_\-]/g, '_')));

    const targetFrag = localList[idx].frag || fragments[idx];
    const remaining = fragments.filter(f => f !== targetFrag);

    setStatus({ saving: true });
    try {
      const resp = await fetch(`http://localhost:3001/api/updateEstudiante/${encodeURIComponent(user.cedula)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competencias: remaining }),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setStatus({ error: body.error || 'Error al eliminar competencia' });
        return;
      }

    // refresh canonical list from server
    await refreshLocalFromServer();
    setStatus({ ok: true });
    if (onUpdated) onUpdated();
    } catch (err) {
      console.error('Error removing competencia:', err);
      setStatus({ error: 'Error de red al eliminar competencia' });
    }
  };

  return (
    <div className="competencias-container">

      {/* TITULO */}
      <h2 className="title">Mis Competencias</h2>
      <p className="subtitle">
        Gestiona, valida y mejora tus habilidades para destacar.
      </p>

      {/* CARDS RESUMEN */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{localList.length}</h3>
          <span>Total de Competencias</span>
        </div>
      </div>

      {/* TABLA */}
      <div className="tabla-competencias">

        {/* Buscador + Botón */}
        <div className="tabla-header">
          <button className="btn-add" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Añadir Competencia
          </button>
        </div>

        {/* COLUMNAS */}
        <table>
          <thead>
            <tr>
              <th>Competencia</th>
              <th>Categoría</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {localList.map((comp, idx) => (
              <tr key={idx}>
                <td>{comp.nombre}</td>

                <td>
                  <span className={`categoria-badge ${(comp.categoria || '').toLowerCase()}`}>
                    {comp.categoria}
                  </span>
                </td>

                <td className="acciones">
                  <Edit3 className="icon edit" size={18} />
                  <Trash2 className="icon delete" size={18} onClick={() => removeCompetencia(idx)} />
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Selecciona competencias</h3>
            <div className="competencias-list">
              {available.map((a) => (
                <label key={a.value} className="competencia-option">
                  <input type="checkbox" checked={selected.has(a.value)} onChange={() => toggleSelect(a.value)} />
                  <span>{a.label}</span>
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-actualizar" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-actualizar" onClick={addSelected}>Añadir seleccionadas</button>
            </div>
            {status && status.error && <div className="status error">{status.error}</div>}
            {status && status.saving && <div className="status">Guardando...</div>}
          </div>
        </div>
      )}
    </div>
  );
}
