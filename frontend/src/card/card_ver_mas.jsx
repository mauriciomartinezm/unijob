import React from "react";
import "../css/csscard/card_ver_mas.css";
import placeholderLogo from "../assets/placeholder-logo.svg";

export default function CardVerMas({
	titulo,
	descripcion,
	modalidad,
	nombreEmpresa,
	requiereCompetencia = [],
	onLike,
	onDislike,
	onApply,
}) {
	return (
		<div className="vermas-card">
			<div className="vermas-header">
				<img src={placeholderLogo} alt="logo" className="vermas-logo" />
				<div className="vermas-titleblock">
					<h3 className="vermas-title">{titulo}</h3>
					<p className="vermas-empresa">{nombreEmpresa}</p>
				</div>
				<div className="vermas-actions">
					<button className="vermas-icon-btn like" title="Me gusta" aria-label="Me gusta" onClick={onLike}>👍</button>
					<button className="vermas-icon-btn dislike" title="No me gusta" aria-label="No me gusta" onClick={onDislike}>👎</button>
				</div>
			</div>

			<div className="vermas-info">
				<div className="vermas-row">
					<span className="vermas-icon">📍</span>
					<span className="vermas-text">{modalidad}</span>
				</div>
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
