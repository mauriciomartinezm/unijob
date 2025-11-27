import "../css/csscard/competencias.css";
import { Plus, Edit3, Trash2 } from "lucide-react";

export default function MisCompetencias({ competencias }) {
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
          <h3>doh</h3>
          <span>Total de Competencias</span>
        </div>
      </div>

      {/* TABLA */}
      <div className="tabla-competencias">

        {/* Buscador + Botón */}
        <div className="tabla-header">
          <button className="btn-add">
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
            {competencias.lista?.map((comp, idx) => (
              <tr key={idx}>
                <td>{comp.nombre}</td>

                <td>
                  <span className={`categoria-badge ${comp.categoria.toLowerCase()}`}>
                    {comp.categoria}
                  </span>
                </td>

                <td className="acciones">
                  <Edit3 className="icon edit" size={18} />
                  <Trash2 className="icon delete" size={18} />
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}
