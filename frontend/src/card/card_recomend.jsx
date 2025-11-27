import "../css/csscard/card_recomend.css";

export default function CardRecomendacion({
  logo,
  titulo,
  empresa,
  ubicacion,
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
      </div>

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
