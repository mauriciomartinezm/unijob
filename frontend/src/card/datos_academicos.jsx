import "../css/csscard/datos_academicos.css";

export default function DatosAcademicos({
  academicos,
  handleAcademicosChange,
  handleCheckbox,
}) {
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
          <input
            name="carrera"
            value={academicos.carrera}
            onChange={handleAcademicosChange}
          />
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
        <button className="btn-actualizar">Guardar Cambios</button>
      </div>
    </div>
  );
}
