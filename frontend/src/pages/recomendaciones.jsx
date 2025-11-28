import { useEffect, useState } from "react";
import CardRecomendacion from "../card/card_recomend.jsx";
import Footer from "../componentes/footer.jsx";
import Navbar from "../componentes/nav.jsx";
import "../css/csspage/recomendaciones.css";
import { useUser } from "../context/UserContext.jsx";

export default function Recomendaciones() {
  const { user } = useUser() || {};
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const logoDefault = "/img/default-logo.png";

  useEffect(() => {
    const load = async () => {
      if (!user || !user.cedula) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`http://localhost:3001/api/recomendaciones/${encodeURIComponent(user.cedula)}/solicitar`);
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body.error || 'Error fetching recomendaciones');
        }
        const body = await resp.json().catch(() => ({}));
        const rows = Array.isArray(body.recommendations) ? body.recommendations : [];
        setRecs(rows);
      } catch (err) {
        console.error('Error loading recomendaciones:', err);
        setError(err.message || 'Error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <>
      <Navbar />
      <div className="reco-container">
        {/* TITULO */}
        <h2 className="reco-main-title">Encuentra tu Próxima Oportunidad</h2>
        <p className="reco-main-subtitle">
          Recomendaciones basadas en tu perfil y competencias.
        </p>

        {loading && <p>Cargando recomendaciones...</p>}
        {error && <p className="error">{error}</p>}

        {/* TARJETAS */}
        <div className="reco-grid">
          {recs.length === 0 && !loading && <p>No hay recomendaciones por ahora.</p>}
          {recs.map((r, index) => (
            <CardRecomendacion
              key={index}
              logo={logoDefault}
              titulo={r.titulo || r.descripcion || 'Sin título'}
              empresa={r.nombreEmpresa || ''}
              ubicacion={r.ubicacionOferta || ''}
              isLocal={user && user.ubicacion && r.ubicacionOferta && user.ubicacion === r.ubicacionOferta}
              modalidad={r.modalidad || ''}
              descripcion={r.descripcion || ''}
              salario={r.salario || ''}
              ofertaId={r.opportunity || r.op || null}
              requiereCompetencia={Array.isArray(r.requiereCompetencia) ? r.requiereCompetencia : (r.requiereCompetencia ? [r.requiereCompetencia] : [])}
              competencias={Array.isArray(r.requiereCompetencia) ? r.requiereCompetencia : (r.requiereCompetencia ? [r.requiereCompetencia] : [])}
            />
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
