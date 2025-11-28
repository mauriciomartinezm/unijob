import "../css/csscard/card_recomend.css";
import placeholderLogo from "../assets/placeholder-logo.svg";
import { useState } from "react";
import CardVerMas from "./card_ver_mas.jsx";

export default function CardRecomendacion({
  titulo,
  empresa,
  ubicacion,
  isLocal = false,
  competencias = [],
  descripcion,
  modalidad,
  requiereCompetencia = [],
  onClick,
  onLike,
  onDislike,
}) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    if (onClick) onClick();
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  return (
    <>
      <div className="reco-card">
        {/* LOGO + TITULO */}
        <div className="reco-header">
          <img src={placeholderLogo} alt="logo" className="reco-logo" />
          <div>
            <h3 className="reco-title">{titulo}</h3>
            <p className="reco-empresa">{empresa}</p>
          </div>
        </div>

        {/* UBICACIÓN */}
        <div className="reco-ubicacion">
          <p>📍</p>
          <p>{ubicacion}</p>
        </div>
        {/* MODALIDAD */}
        {modalidad && (
          <div className="reco-modalidad" style={{ marginTop: 8 }}>
            <strong>Modalidad:</strong> <span>{modalidad}</span>
          </div>
        )}
        {/* COMPETENCIAS */}
        <p className="reco-subtitle">COMPETENCIAS REQUERIDAS</p>
        <div className="reco-tags">
          {competencias.map((c, idx) => (
            <span key={idx} className="reco-tag">
              {c}
            </span>
          ))}
        </div>

        <hr className="reco-divider" />

        {/* BOTÓN */}
        <button className="reco-btn" onClick={handleOpen}>
          Ver más
        </button>
      </div>
      {open && (
        <div className="vermas-overlay" onClick={handleClose}>
          <div className="vermas-modal" onClick={(e) => e.stopPropagation()}>
            <CardVerMas
              titulo={titulo}
              descripcion={descripcion}
              modalidad={modalidad || ubicacion}
              nombreEmpresa={empresa}
              requiereCompetencia={
                competencias.length ? competencias : requiereCompetencia
              }
              onLike={onLike}
              onDislike={onDislike}
              onApply={handleClose}
            />
          </div>
        </div>
      )}
    </>
  );
}
