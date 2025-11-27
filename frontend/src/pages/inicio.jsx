import equipo from "../img/trabajoeuquipo.jpg";
import "../css/csspage/inicio.css";
import stonk from "../img/stonk.png";
import idea from "../img/idea.png";
import ahorra from "../img/ahorra.png";
import Navbar from "../componentes/nav.jsx";
import { NavLink } from "react-router-dom";

export default function Inicio() {
  return (
    <>
      <Navbar />
      <div className="hero-container">
        <div className="hero-text">
          <h1>
            Encuentra la <br />
            práctica de tus <br />
            sueños con <br />
            inteligencia <br />
            artificial
          </h1>

          <p>
            UniJob conecta tu perfil profesional y académico con las <br />
            mejores oportunidades de prácticas en el mercado.
          </p>
          <NavLink to="/recomendaciones" className="hero-btn navlink-btn">
            Encuentra tu Práctica Ideal
          </NavLink>
        </div>

        <div className="hero-img-container">
          <img src={equipo} alt="Estudiantes" className="hero-img" />
        </div>
      </div>

      {/* BENEFICIOS */}
      <div className="beneficios-container">
        <h4 className="beneficios-subtitle">
          DESCUBRE LOS BENEFICIOS DE UNIJOB
        </h4>
        <h2 className="beneficios-title">Potencia tu búsqueda de prácticas</h2>
        <p className="beneficios-description">
          Nuestra plataforma inteligente está diseñada para simplificar tu
          camino hacia una carrera exitosa.
        </p>

        <div className="beneficios-cards">
          <div className="beneficio-card">
            <div className="beneficio-icon">
              <img src={idea} alt="Recomendaciones Inteligentes" />
            </div>
            <h3>Recomendaciones Inteligentes</h3>
            <p>
              Recibe sugerencias de prácticas personalizadas basadas en tus
              habilidades, intereses y perfil académico.
            </p>
          </div>

          <div className="beneficio-card">
            <div className="beneficio-icon">
              <img src={ahorra} alt="Ahorra Tiempo" />
            </div>
            <h3>Ahorra Tiempo</h3>
            <p>
              Deja de buscar manualmente. Nuestro sistema te presenta las
              oportunidades más relevantes para ti.
            </p>
          </div>

          <div className="beneficio-card">
            <div className="beneficio-icon">
              <img src={stonk} alt="Impulsa tu Carrera" />
            </div>
            <h3>Impulsa tu Carrera</h3>
            <p>
              Conéctate directamente con empresas innovadoras y da el primer
              paso hacia tu futuro profesional.
            </p>
          </div>
        </div>
      </div>

      {/* ¿CÓMO FUNCIONA? */}
      <div className="funciona-container">
        <h2 className="funciona-title">¿Cómo Funciona?</h2>

        <div className="funciona-steps">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Completa tu Perfil</h3>
            <p>
              Añade tus habilidades, experiencia y preferencias académicas para
              que te conozcamos mejor.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Recibe Recomendaciones</h3>
            <p>
              Nuestra IA analiza tu perfil y te envía las ofertas de prácticas
              que mejor se adaptan a ti.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Aplica con un Clic</h3>
            <p>
              Postula directamente a las oportunidades que te interesan y
              gestiona tus aplicaciones.
            </p>
          </div>
        </div>
      </div>

      {/* CTA FINAL */}
      <div className="cta-final">
        <h2>¿Listo para encontrar la práctica de tus sueños?</h2>
        <p>
          Crea tu perfil en minutos y deja que la inteligencia artificial te
          conecte con tu futuro profesional.
        </p>
        <NavLink to="/register" className="hero-btnr navlink-btnr">
          Registrarse gratis
        </NavLink>
      </div>
    </>
  );
}
