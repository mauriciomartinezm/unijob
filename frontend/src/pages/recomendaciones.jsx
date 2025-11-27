import CardRecomendacion from "../card/card_recomend.jsx";
import Navbar from "../componentes/nav.jsx";
import "../css/csspage/recomendaciones.css";

export default function Recomendaciones() {
  // === DATOS HARDCODEADOS (EJEMPLO) ===
  const recomendaciones = [
    {
      titulo: "Desarrollador Frontend",
      empresa: "Google",
      ubicacion: "Madrid, España",
      competencias: ["React", "TypeScript", "CSS"],
    },
    {
      titulo: "Prácticas en Data Science",
      empresa: "Spotify",
      ubicacion: "Barcelona, España",
      competencias: ["Python", "SQL", "Pandas"],
    },
    {
      titulo: "Diseñador UX/UI Intern",
      empresa: "Microsoft",
      ubicacion: "Remoto",
      competencias: ["Figma", "Prototipado", "User Research"],
    },
    {
      titulo: "Backend Engineer Intern",
      empresa: "Airbnb",
      ubicacion: "Valencia, España",
      competencias: ["Node.js", "REST APIs", "MongoDB"],
    },
  ];

  const logoDefault = "/img/default-logo.png";
  return (
    <>
      <Navbar />
      <div className="reco-container">
        {/* TITULO */}
        <h2 className="reco-main-title">Encuentra tu Próxima Oportunidad</h2>
        <p className="reco-main-subtitle">
          Aquí tienes algunas recomendaciones basadas en tu perfil y
          preferencias.
        </p>

        {/* TARJETAS */}
        <div className="reco-grid">
          {recomendaciones.map((item, index) => (
            <CardRecomendacion
              key={index}
              logo={logoDefault}
              titulo={item.titulo}
              empresa={item.empresa}
              ubicacion={item.ubicacion}
              competencias={item.competencias}
            />
          ))}
        </div>
      </div>
    </>
  );
}
