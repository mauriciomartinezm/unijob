import "../css/csscard/card_recomend.css";
import placeholderLogo from "../assets/placeholder-logo.svg";
import { useState } from "react";
import { createPortal } from "react-dom";
import CardVerMas from "./card_ver_mas.jsx";
import { MapPin } from "lucide-react";

export default function CardRecomendacion({
  titulo,
  empresa,
  ubicacion,
  isLocal = false,
  competencias = [],
  descripcion,
  modalidad,
  salario,
  requiereCompetencia = [],
  onClick,
  onLike,
  onDislike,
  ofertaId = null,
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
          <MapPin className="reco-icon" size={16} />
          <p>{ubicacion}</p>
        </div>
        {/* MODALIDAD */}
        {modalidad && (
          <div className="reco-modalidad" style={{ marginTop: 8 }}>
            <strong>Modalidad:</strong> <span>{modalidad}</span>
          </div>
        )}
        {/* SALARIO */}
        {typeof salario !== 'undefined' && salario !== '' && (
          <div className="reco-salario" style={{ marginTop: 8 }}>
            <strong>Salario:</strong> <span>{salario}</span>
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
      {open && createPortal(
        (
          <div className="vermas-overlay" onClick={handleClose}>
            <div className="vermas-modal" data-oferta-id={ofertaId || ''} onClick={(e) => e.stopPropagation()}>
              <CardVerMas
                titulo={titulo}
                descripcion={descripcion}
                ubicacion={ubicacion}
                modalidad={modalidad}
                nombreEmpresa={empresa}
                ofertaId={ofertaId}
                salario={salario}
                requiereCompetencia={
                  competencias.length ? competencias : requiereCompetencia
                }
                onLike={onLike}
                onDislike={onDislike}
                onApply={handleClose}
              />
            </div>
          </div>
        ),
        document.body
      )}
    </>
  );
}
