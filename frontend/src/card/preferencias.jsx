import "../css/csscard/preferencias.css";

export default function Preferencias({
  preferencias,
  handlePreferenciasChange,
}) {
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
          <option value="remoto">Remoto</option>
          <option value="hibrida">Híbrida</option>
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
        <input
          name="ubicacion"
          value={preferencias.ubicacion}
          onChange={handlePreferenciasChange}
          className="input-small"
        />
      </div>

      {/* BOTÓN */}
      <div className="btn-container">
        <button className="btn-actualizar">Guardar Cambios</button>
      </div>
    </div>
  );
}
