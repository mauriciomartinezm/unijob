import { Routes, Route } from "react-router-dom";
import Inicio from "./pages/inicio.jsx";
import Login from "./pages/Login.jsx";
import MiPerfil from "./pages/perfil.jsx";
import './App.css';
import CardRecomendacion from "./pages/recomendaciones.jsx";

function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/perfil" element={<MiPerfil />} />
      <Route path="/recomendaciones" element={<CardRecomendacion />} />
    </Routes>
    </>
  );
}

export default App;
