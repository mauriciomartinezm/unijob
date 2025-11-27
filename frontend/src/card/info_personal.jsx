// src/componentes/info_personal.jsx
import React from "react";

export default function InfoPersonal({ form, handleChange }) {
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
          <label>Email</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Cedula</label>
          <input
            name="cedula"
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

      <label>Resumen Profesional</label>
      <textarea
        name="resumen"
        value={form.resumen}
        onChange={handleChange}
      />

      <div className="btn-container">
        <button className="btn-actualizar">Actualizar perfil</button>
      </div>
    </div>
  );
}
