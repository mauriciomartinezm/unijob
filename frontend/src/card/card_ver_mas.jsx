import React, { useState } from "react";
import "../css/csscard/card_ver_mas.css";
import placeholderLogo from "../assets/placeholder-logo.svg";
import { useUser } from "../context/UserContext.jsx";


export default function CardVerMas({
    titulo,
    descripcion,
    ubicacion,
    modalidad,
	salario,
    nombreEmpresa,
    requiereCompetencia = [],
    onLike,
    onDislike,
    onApply,
    ofertaId = null,
}) {
	const { user } = useUser() || {};
	const [showDislikeReason, setShowDislikeReason] = useState(false);
	const [selectedReasons, setSelectedReasons] = useState([]);
	const [sending, setSending] = useState(false);
	const [sentOk, setSentOk] = useState(false);

	const reasonOptions = [
		'Ubicación',
		'Salario',
		'Modalidad'
	];

	const handleDislikeClick = () => {
		setShowDislikeReason(true);
	};

	const toggleReason = (r) => {
		setSelectedReasons(prev => {
			if (prev.includes(r)) return prev.filter(x => x !== r);
			return [...prev, r];
		});
	};

	const handleSubmitReason = async () => {
		if (!selectedReasons || selectedReasons.length === 0) return;
		// join selected reasons into a single motivo string so backend can persist and inspect
		const motivo = selectedReasons.join('; ');
		const payload = {
			userId: user.cedula,
			gusto: false,
			motivo,
			// ofertaId will be attached by parent via data-oferta on the modal container if available
		};

		if (ofertaId) payload.ofertaId = ofertaId;
		// attach contextual fields so the profile agent can persist preferences directly
		if (selectedReasons.includes('Salario') && typeof salario !== 'undefined' && salario !== null) {
			payload.salario = salario;
		}
		if (selectedReasons.includes('Ubicación') && typeof ubicacion !== 'undefined' && ubicacion !== null) {
			payload.ubicacion = ubicacion;
		}
		if (selectedReasons.includes('Modalidad') && typeof modalidad !== 'undefined' && modalidad !== null) {
			payload.modalidad = modalidad;
		}

		if (!payload.userId) {
			alert('Debes iniciar sesión para enviar feedback sobre una oferta.');
			setShowDislikeReason(false);
			return;
		}

		try {
			setSending(true);
			await fetch('http://localhost:3001/api/interaccion', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			setSentOk(true);
			setShowDislikeReason(false);
			setSelectedReasons([]);
			if (onDislike) onDislike();
		} catch (err) {
			console.error('Error sending dislike reason:', err);
		} finally {
			setSending(false);
		}
	};
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
					<button className="vermas-icon-btn dislike" title="No me gusta" aria-label="No me gusta" onClick={handleDislikeClick}>👎</button>
				</div>
			</div>

			<div className="vermas-info">
				{/* Ubicación */}
				{ubicacion && (
					<div className="vermas-row">
						<span className="vermas-icon">📍</span>
						<span className="vermas-text">{ubicacion}</span>
					</div>
				)}

				{/* Modalidad */}
				{modalidad && (
					<div className="vermas-row">
						<span className="vermas-icon">🖥️</span>
						<span className="vermas-text">{modalidad}</span>
					</div>
				)}

				{/* Salario */}
				{typeof salario !== 'undefined' && salario !== '' && (
					<div className="vermas-row">
						<span className="vermas-icon">💰</span>
						<span className="vermas-text">{salario}</span>
					</div>
				)}
			</div>

			<div className="vermas-desc">
				<p>{descripcion}</p>
			</div>

			{/* Dislike reason popup */}
			{showDislikeReason && (
				<div className="dislike-reason-panel">
					<h4>¿Por qué no te gustó esta oferta?</h4>
					<div className="reason-list" >
						{reasonOptions.map((r, i) => (
							<label key={i} className="reason-option">
								<input type="checkbox" name={`reason_${i}`} value={r} checked={selectedReasons.includes(r)} onChange={() => toggleReason(r)} />
								{r}
							</label>
						))}
					</div>
					<div className="reason-actions">
						<button onClick={() => setShowDislikeReason(false)} className="btn-actualizar">Cancelar</button>
						<button onClick={handleSubmitReason} className="btn-actualizar" disabled={sending || selectedReasons.length === 0}>{sending ? 'Enviando...' : 'Enviar feedback'}</button>
					</div>
				</div>
			)}

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
