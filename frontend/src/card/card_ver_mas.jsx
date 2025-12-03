import React, { useState } from "react";
import "../css/csscard/card_ver_mas.css";
import placeholderLogo from "../assets/placeholder-logo.svg";
import { useUser } from "../context/UserContext.jsx";
import { MapPin, MonitorSmartphone, Wallet } from "lucide-react";


export default function CardVerMas({
    titulo,
    descripcion,
    ubicacion,
    modalidad,
	salario,
    nombreEmpresa,
    requiereCompetencia = [],
    onLike,
    onApply,
    ofertaId = null,
}) {
	const { user } = useUser() || {};
	return (
		<div className="vermas-card">
			<div className="vermas-header">
				<img src={placeholderLogo} alt="logo" className="vermas-logo" />
				<div className="vermas-titleblock">
					<h3 className="vermas-title">{titulo}</h3>
					<p className="vermas-empresa">{nombreEmpresa}</p>
				</div>
			</div>

			<div className="vermas-info">
				{/* Ubicación */}
				{ubicacion && (
					<div className="vermas-row">
						<MapPin className="vermas-icon" />
						<span className="vermas-text">{ubicacion}</span>
					</div>
				)}

				{/* Modalidad */}
				{modalidad && (
					<div className="vermas-row">
						<MonitorSmartphone className="vermas-icon" />
						<span className="vermas-text">{modalidad}</span>
					</div>
				)}

				{/* Salario */}
				{typeof salario !== 'undefined' && salario !== '' && (
					<div className="vermas-row">
						<Wallet className="vermas-icon" />
						<span className="vermas-text">{salario}</span>
					</div>
				)}
			</div>

			<div className="vermas-desc">
				<p>{descripcion}</p>
			</div>


			<p className="vermas-subtitle">COMPETENCIAS REQUERIDAS</p>
			<div className="vermas-tags">
				{requiereCompetencia.map((c, idx) => (
					<span key={idx} className="vermas-tag">{c}</span>
				))}
			</div>

			<hr className="vermas-divider" />

			<button className="vermas-btn" onClick={onApply}>Postular</button>
		</div>
	);
}
