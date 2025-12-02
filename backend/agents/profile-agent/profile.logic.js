import { sparqlQuery, sparqlUpdate } from "../../shared/fuseki-client.js";

// Normalize salary-like strings to a plain numeric string (e.g. "$1,200.00" -> "1200.00").
// Returns a string with up to 2 decimal places or null if parsing fails.
function normalizeSalary(val) {
    try {
        if (typeof val === 'undefined' || val === null) return null;
        const raw = String(val).replace(/[^0-9.\-]/g, '');
        const n = Number(raw);
        if (!Number.isFinite(n)) return null;
        // keep up to 2 decimals
        return String(Number(n.toFixed(2)));
    } catch (e) {
        return null;
    }
}

/*
data = {
    userId: "estudiante123",
    competencia: "ProgramacionWeb",
    gusto: true   // true = le gusta / false = no le interesa
}
*/

export async function updateUserPreference(data) {
    // data may contain: { userId, competencia?, gusto?, motivo?, ofertaId? }
    const { userId } = data;
    if (!userId) throw new Error('userId requerido en updateUserPreference');

    // Build subject reference (allow full URI or fragment)
    const subjectRef = userId.startsWith('http') ? `<${userId}>` : `practicas:${String(userId).trim().replace(/[^a-zA-Z0-9_\-]/g, '_')}`;

    const triples = [];

    // If competencia provided, record it as a preference-like interaction
    if (data.competencia) {
        const safeComp = String(data.competencia).trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
        triples.push(`${subjectRef} practicas:tienePreferencia practicas:${safeComp} .`);
    }

    if (typeof data.gusto !== 'undefined') {
        const val = data.gusto ? 'like' : 'dislike';
        triples.push(`${subjectRef} practicas:valorPreferencia "${String(val)}" .`);
    }

    // Optional: persist a textual reason/motivo for the interaction (useful when user rejects a recommendation)
    if (data.motivo) {
        const safeMotivo = String(data.motivo).replace(/"/g, '\\"');
        triples.push(`${subjectRef} practicas:motivoInteraccion "${safeMotivo}" .`);
    }

    // Optional: link the interaction to a specific oferta (recommendation) if provided
    if (data.ofertaId) {
        const safeOferta = String(data.ofertaId).trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
        triples.push(`${subjectRef} practicas:reaccionSobre practicas:${safeOferta} .`);
    }

    // If the interaction references an oferta and the motivo indicates a location issue,
    // persist the oferta's ubicacion as a rejected location for the user so recommender can exclude it.
    if (data.ofertaId && data.motivo && /ubic/i.test(String(data.motivo))) {
        try {
            const ofertaRef = data.ofertaId.startsWith('http') ? `<${data.ofertaId}>` : `practicas:${String(data.ofertaId).trim().replace(/[^a-zA-Z0-9_\-]/g, '_')}`;
            const q = `PREFIX practicas: <http://www.unijob.edu/practicas#> SELECT ?u WHERE { ${ofertaRef} practicas:ubicacionOferta ?u } LIMIT 1`;
            const r = await sparqlQuery(q);
            const b = r && r.results && r.results.bindings ? r.results.bindings : [];
            if (b.length > 0 && b[0].u && b[0].u.value) {
                const safeUb = String(b[0].u.value).replace(/"/g, '\\"');
                triples.push(`${subjectRef} practicas:ubicacionRechazada "${safeUb}" .`);
            }
        } catch (e) {
            console.error('Error obteniendo ubicacion de oferta para registrar ubicacionRechazada:', e);
        }
    }

    // If the interaction explicitly included a ubicacion field and it's a dislike, persist it
    if (data.ubicacion && typeof data.gusto !== 'undefined' && data.gusto === false) {
        const safeUb2 = String(data.ubicacion).replace(/"/g, '\\"');
        triples.push(`${subjectRef} practicas:ubicacionRechazada "${safeUb2}" .`);
    }

    // If the user provided a salary in the interaction (or the motivo mentions salary and ofertaId present),
    // persist it as the user's salarioPreferido (minimum acceptable salary).
    try {
        if (typeof data.salario !== 'undefined' && data.salario !== null && data.salario !== '') {
            const normalized = normalizeSalary(data.salario);
            const toPersist = normalized !== null ? normalized : String(data.salario).replace(/"/g, '\\"');
            const qSal = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} practicas:salarioPreferido ?old . }\nINSERT { ${subjectRef} practicas:salarioPreferido "${toPersist}" . }\nWHERE { OPTIONAL { ${subjectRef} practicas:salarioPreferido ?old . } }`;
            await sparqlUpdate(qSal);
        } else if (data.ofertaId && data.motivo && /salari/i.test(String(data.motivo))) {
            // try to query the oferta for its salario and persist that as salarioPreferido
            try {
                const ofertaRef = data.ofertaId.startsWith('http') ? `<${data.ofertaId}>` : `practicas:${String(data.ofertaId).trim().replace(/[^a-zA-Z0-9_\-]/g, '_')}`;
                const q = `PREFIX practicas: <http://www.unijob.edu/practicas#> SELECT ?s WHERE { ${ofertaRef} practicas:salario ?s } LIMIT 1`;
                const r = await sparqlQuery(q);
                const b = r && r.results && r.results.bindings ? r.results.bindings : [];
                if (b.length > 0 && b[0].s && b[0].s.value) {
                    const ofertaSal = b[0].s.value;
                    const normalized2 = normalizeSalary(ofertaSal);
                    const toPersist2 = normalized2 !== null ? normalized2 : String(ofertaSal).replace(/"/g, '\\"');
                    const qSal2 = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} practicas:salarioPreferido ?old . }\nINSERT { ${subjectRef} practicas:salarioPreferido "${toPersist2}" . }\nWHERE { OPTIONAL { ${subjectRef} practicas:salarioPreferido ?old . } }`;
                    await sparqlUpdate(qSal2);
                }
            } catch (e) {
                console.error('Error obteniendo salario de oferta para registrar salarioPreferido:', e);
            }
        }
    } catch (e) {
        console.error('Error al persistir salarioPreferido desde interaccion:', e);
    }

    if (triples.length === 0) return; // nothing to persist

    const update = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nINSERT DATA {\n${triples.join('\n')}\n}`;
    await sparqlUpdate(update);
}

export async function updateUserPreferences(data) {
    // data = { userId, ubicacion?, modalidad?, salario? }
    const { cedula } = data;
    if (!cedula) throw new Error('cedula requerido');

    // Helper to build subject reference (allow full URI or fragment)
    const subjectRef = cedula.startsWith('http') ? `<${cedula}>` : `practicas:${String(cedula).trim().replace(/[^a-zA-Z0-9_\-]/g, '_')}`;
    // Persist each provided preference with a DELETE/INSERT pattern
    if (typeof data.ubicacion !== 'undefined') {
        const safe = String(data.ubicacion).replace(/"/g, '\\"');
        const q = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} practicas:ubicacionPreferida ?old . }\nINSERT { ${subjectRef} practicas:ubicacionPreferida "${safe}" . }\nWHERE { OPTIONAL { ${subjectRef} practicas:ubicacionPreferida ?old . } }`;
        await sparqlUpdate(q);
    }

    if (typeof data.modalidad !== 'undefined') {
        const safe = String(data.modalidad).replace(/"/g, '\\"');
        const q = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} practicas:modalidadPreferida ?old . }\nINSERT { ${subjectRef} practicas:modalidadPreferida "${safe}" . }\nWHERE { OPTIONAL { ${subjectRef} practicas:modalidadPreferida ?old . } }`;
        await sparqlUpdate(q);
    }

    if (typeof data.salario !== 'undefined') {
        const normalized = normalizeSalary(data.salario);
        const toPersist = normalized !== null ? normalized : String(data.salario).replace(/"/g, '\\"');
        const q = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} practicas:salarioPreferido ?old . }\nINSERT { ${subjectRef} practicas:salarioPreferido "${toPersist}" . }\nWHERE { OPTIONAL { ${subjectRef} practicas:salarioPreferido ?old . } }`;
        await sparqlUpdate(q);
    }
}
