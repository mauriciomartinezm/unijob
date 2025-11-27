import { useState, useEffect } from "react";
import "../css/csspage/perfil.css";
import Navbar from "../componentes/nav.jsx";
import { useUser } from "../context/UserContext.jsx";

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

  const { user } = useUser();

  const [form, setForm] = useState({
    nombre: user?.nombre || "",
    cedula: user?.cedula || "",
    email: "",
    telefono: user?.telefono || "",
    ubicacion: user?.ubicacion || "",
    resumen: "",
  });

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        nombre: user.nombre || f.nombre,
        cedula: user.cedula || f.cedula,
        telefono: user.telefono || f.telefono,
        ubicacion: user.ubicacion || f.ubicacion,
      }));
    }
  }, [user]);

  // Load full student profile (preferences, carrera, etc.) from backend
  const loadProfile = async () => {
    if (!user || !user.cedula) return;
    try {
      const resp = await fetch(`http://localhost:3001/api/getEstudiante/${encodeURIComponent(user.cedula)}`);
      if (!resp.ok) return;
      const stu = await resp.json().catch(() => ({}));

      const props = (stu && stu.propiedades) ? stu.propiedades : {};

      // preferencias: ubicacionPreferida, modalidadPreferida, salarioPreferido
      const ubicPref = Array.isArray(props.ubicacionPreferida) ? props.ubicacionPreferida[0] : (props.ubicacionPreferida || '');
      const modPref = Array.isArray(props.modalidadPreferida) ? props.modalidadPreferida[0] : (props.modalidadPreferida || '');
      const salPref = Array.isArray(props.salarioPreferido) ? props.salarioPreferido[0] : (props.salarioPreferido || '');

      setPreferencias(p => ({
        ...p,
        modalidad: modPref || p.modalidad,
        salario: salPref || p.salario,
        ubicacion: ubicPref || p.ubicacion,
      }));

      // academicos: carrera <- perteneceACarrera may be a URI or fragment
      const carreraVal = (() => {
        const c = props.perteneceACarrera;
        if (!c) return academicos.carrera || '';
        const first = Array.isArray(c) ? c[0] : c;
        if (!first) return '';
        // if it's a full uri, extract fragment
        const frag = (first || '').split(/[#\/]/).pop();
        return frag;
      })();

      setAcademicos(a => ({ ...a, carrera: carreraVal }));

      // form: nombre, telefono, ubicacion, cedula
      const nombreVal = Array.isArray(props.nombre) ? props.nombre[0] : (props.nombre || '');
      const telefonoVal = Array.isArray(props.telefono) ? props.telefono[0] : (props.telefono || '');
      const ubicVal = ubicPref || (Array.isArray(props.ubicacion) ? props.ubicacion[0] : (props.ubicacion || ''));

      setForm(f => ({ ...f, nombre: nombreVal || f.nombre, telefono: telefonoVal || f.telefono, ubicacion: ubicVal || f.ubicacion }));
    } catch (err) {
      console.error('Error loading student profile in perfil:', err);
    }
  };

  const [academicos, setAcademicos] = useState({
    universidad: "",
    carrera: "",
    semestre: "",
    promedio: "",

    industria: "",
    rol: "",
    ubicacion_preferida: "",
  });

  const [preferencias, setPreferencias] = useState({
    tipo_practica: "",
    modalidad: "",
    salario: "",
    ubicacion: "",
  });

  const [competenciasState, setCompetenciasState] = useState({ lista: [] });
  const loadCompetencias = async () => {
    if (!user || !user.cedula) return;
    try {
      // fetch student properties
      const resp = await fetch(`http://localhost:3001/api/getEstudiante/${encodeURIComponent(user.cedula)}`);
      if (!resp.ok) return;
      const stu = await resp.json().catch(() => ({}));

      // fetch competencies master list to map labels
      const respC = await fetch('http://localhost:3001/api/getCompetencias');
      const allComp = respC.ok ? await respC.json().catch(() => []) : [];
      const compMap = {};
      for (const r of (Array.isArray(allComp) ? allComp : [])) {
        const uri = r.uri || '';
        const frag = uri.split(/[#\/]/).pop();
        const label = (r.propiedades && (r.propiedades.nombreCompetencia || r.propiedades.nombre) && (r.propiedades.nombreCompetencia || r.propiedades.nombre)[0]) || frag;
        compMap[frag] = label;
      }

      const lista = [];
      const posee = (stu.propiedades && stu.propiedades.poseeCompetencia) ? stu.propiedades.poseeCompetencia : [];
      for (const p of posee) {
        const frag = (p || '').split(/[#\\/]/).pop();
        const label = compMap[frag] || (frag || '').replace(/_/g, ' ');
        lista.push({ nombre: label, categoria: '', frag });
      }

      setCompetenciasState({ lista });
    } catch (err) {
      console.error('Error loading student competencias in perfil:', err);
    }
  };

  useEffect(() => {
    loadCompetencias();
    loadProfile();
  }, [user]);

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

            <h2 className="perfil-nombre">{form.nombre || 'Sin Nombre'}</h2>
            <p className="perfil-sub">{form.cedula ? `Cédula: ${form.cedula}` : ''}</p>
            <p className="perfil-sub">{academicos.carrera}</p>

            <div className="competencias-box">
              <h3>COMPETENCIAS DETECTADAS</h3>
              <div className="chips">
                {competenciasState.lista && competenciasState.lista.length > 0 ? (
                  competenciasState.lista.map((c, i) => (
                    <span key={i} className="chip">{c.nombre}</span>
                  ))
                ) : (
                  <span className="chip muted">No hay competencias detectadas</span>
                )}
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
              <MisCompetencias competencias={competenciasState} onUpdated={loadCompetencias} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
