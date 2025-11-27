import { useState } from "react";
import "../css/csspage/perfil.css";
import Navbar from "../componentes/nav.jsx";

// Componentes externos
import InfoPersonal from "../card/info_personal.jsx";
import DatosAcademicos from "../card/datos_academicos.jsx";
import Preferencias from "../card/preferencias.jsx";
import MisCompetencias from "../card/mis_competencias.jsx"; // ⬅️ IMPORTANTE

export default function MiPerfil() {
  const [activeTab, setActiveTab] = useState("info");

  const defaultImage =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const [profileImage, setProfileImage] = useState(defaultImage);

  const [form, setForm] = useState({
    nombre: "Ana García",
    email: "ana.garcia@email.com",
    telefono: "1213313",
    ubicacion: "Ciudad de México, México",
    resumen: "",
  });

  const [academicos, setAcademicos] = useState({
    universidad: "Universidad Politécnica Nacional",
    carrera: "Ingeniería de Software",
    semestre: "8",
    promedio: "3.9",

    industria: "Tecnología, Consultoría",
    rol: "Desarrollo Full-Stack, Project Manager",
    ubicacion_preferida: "Remoto, Híbrido (CDMX)",
    tipo_empresa: {
      startup: true,
      corporativo: false,
      scaleup: true,
      ong: false,
      gobierno: false,
    },
  });

  const [preferencias, setPreferencias] = useState({
    tipo_practica: "",
    modalidad: "",
    salario: "",
    ubicacion: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAcademicosChange = (e) => {
    setAcademicos({ ...academicos, [e.target.name]: e.target.value });
  };

  const handleCheckbox = (name) => {
    setAcademicos({
      ...academicos,
      tipo_empresa: {
        ...academicos.tipo_empresa,
        [name]: !academicos.tipo_empresa[name],
      },
    });
  };

  const handlePreferenciasChange = (e) => {
    setPreferencias({
      ...preferencias,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const imgURL = URL.createObjectURL(file);
    setProfileImage(imgURL);
  };

  return (
    <>
      <Navbar />
      <div className="perfil-page">
        <div className="perfil-container">

          {/* LATERAL */}
          <div className="perfil-left">
            <div className="perfil-img-wrapper">
              <img src={profileImage} className="perfil-img" alt="perfil" />
              <label className="cambiar-foto-btn">
                Cambiar foto
                <input type="file" accept="image/*" onChange={handleImageChange} hidden />
              </label>
            </div>

            <h2 className="perfil-nombre">Ana García</h2>
            <p className="perfil-sub">Ingeniería de Software</p>
            <p className="perfil-sub">8° Semestre</p>

            <div className="competencias-box">
              <h3>COMPETENCIAS DETECTADAS</h3>
              <div className="chips">
                {["Python", "Project Management", "UI/UX Design", "React", "SQL"].map((c) => (
                  <span key={c} className="chip">{c}</span>
                ))}
              </div>
            </div>
          </div>

          {/* DERECHA */}
          <div className="perfil-right">

            {/* TABS */}
            <div className="tabs">
              <button className={activeTab === "info" ? "active" : ""} onClick={() => setActiveTab("info")}>Información Personal</button>
              <button className={activeTab === "academicos" ? "active" : ""} onClick={() => setActiveTab("academicos")}>Datos Académicos</button>
              <button className={activeTab === "preferencias" ? "active" : ""} onClick={() => setActiveTab("preferencias")}>Preferencias</button>
              <button className={activeTab === "competencias" ? "active" : ""} onClick={() => setActiveTab("competencias")}>Mis Competencias</button>
            </div>

            {/* CONTENIDO */}
            {activeTab === "info" && (
              <InfoPersonal form={form} handleChange={handleChange} />
            )}

            {activeTab === "academicos" && (
              <DatosAcademicos
                academicos={academicos}
                handleAcademicosChange={handleAcademicosChange}
                handleCheckbox={handleCheckbox}
              />
            )}

            {activeTab === "preferencias" && (
              <Preferencias
                preferencias={preferencias}
                handlePreferenciasChange={handlePreferenciasChange}
              />
            )}

            {activeTab === "competencias" && (
              <MisCompetencias
                competencias={{
                  total: 12,
                  verificadas: 8,
                  sugeridas: 3,
                  lista: [
                    { nombre: "Desarrollo en Python", categoria: "Programación", estado: "Verificada" },
                    { nombre: "Trabajo en Equipo", categoria: "Habilidades Blandas", estado: "Verificada" },
                    { nombre: "Gestión de Proyectos con Jira", categoria: "Herramientas", estado: "Pendiente" },
                    { nombre: "Inglés Avanzado (C1)", categoria: "Idiomas", estado: "Verificada" },
                    { nombre: "Análisis de Datos con Pandas", categoria: "Programación", estado: "Sugerida" }
                  ]
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
