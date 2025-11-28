import "../css/csscard/card_recomend.css";

export default function CardRecomendacion({
  logo,
  titulo,
  empresa,
  ubicacion,
  isLocal = false,
  modalidad,
  competencias = [],
  onClick,
}) {
  return (
    <div className="reco-card">

      {/* LOGO + TITULO */}
      <div className="reco-header">
        <img src={logo} alt="logo" className="reco-logo" />
        <div>
          <h3 className="reco-title">{titulo}</h3>
          <p className="reco-empresa">{empresa}</p>
        </div>
      </div>

      {/* UBICACIÓN */}
      <div className="reco-ubicacion">
        <p>📍</p>
        <p>{ubicacion}</p>
        {isLocal && (
          <span className="reco-local-badge" style={{ marginLeft: 8, color: '#0a7f00', fontWeight: '600' }}>Cerca</span>
        )}
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
          <span key={idx} className="reco-tag">{c}</span>
        ))}
      </div>

      <hr className="reco-divider" />

      {/* BOTÓN */}
      <button className="reco-btn" onClick={onClick}>
        Ver más
      </button>
    </div>
  );
}
