import { sparqlQuery, sparqlUpdate } from "../../shared/fuseki-client.js";

function normalizeSalary(val) {
    try {
        if (typeof val === 'undefined' || val === null) return null;
        const raw = String(val).replace(/[^0-9.\-]/g, '');
        const n = Number(raw);
        if (!Number.isFinite(n)) return null;
        return String(Number(n.toFixed(2)));
    } catch (e) {
        return null;
    }
}
export async function updateUserPreferences(data) {
    const { cedula } = data;
    if (!cedula) throw new Error('cedula requerido');

    const subjectRef = cedula.startsWith('http') ? `<${cedula}>` : `practicas:${String(cedula).trim().replace(/[^a-zA-Z0-9_\-]/g, '_')}`;
    if (typeof data.ubicacion !== 'undefined') {
        // If ubicacion is an empty string (user selected the default 'Seleccione...'),
        // remove the preference (DELETE only). Otherwise replace with the provided value.
        const rawUb = data.ubicacion;
        const trimmed = (rawUb === null || typeof rawUb === 'undefined') ? '' : String(rawUb).trim();
        if (trimmed === '') {
            const qdel = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} practicas:ubicacionPreferida ?old . }\nWHERE { OPTIONAL { ${subjectRef} practicas:ubicacionPreferida ?old . } }`;
            await sparqlUpdate(qdel);
        } else {
            const safe = String(trimmed).replace(/"/g, '\\"');
            const q = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} practicas:ubicacionPreferida ?old . }\nINSERT { ${subjectRef} practicas:ubicacionPreferida "${safe}" . }\nWHERE { OPTIONAL { ${subjectRef} practicas:ubicacionPreferida ?old . } }`;
            await sparqlUpdate(q);
        }
    }

    if (typeof data.modalidad !== 'undefined') {
        const safe = String(data.modalidad).replace(/"/g, '\\"');
        const q = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} practicas:modalidadPreferida ?old . }\nINSERT { ${subjectRef} practicas:modalidadPreferida "${safe}" . }\nWHERE { OPTIONAL { ${subjectRef} practicas:modalidadPreferida ?old . } }`;
        await sparqlUpdate(q);
    }

    if (typeof data.salario !== 'undefined') {
        // allow clearing the salarioPreferido by sending an empty string
        const rawSal = data.salario;
        const trimmedSal = (rawSal === null || typeof rawSal === 'undefined') ? '' : String(rawSal).trim();
        if (trimmedSal === '') {
            const qdel = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} practicas:salarioPreferido ?old . }\nWHERE { OPTIONAL { ${subjectRef} practicas:salarioPreferido ?old . } }`;
            await sparqlUpdate(qdel);
        } else {
            const normalized = normalizeSalary(trimmedSal);
            const toPersist = normalized !== null ? normalized : String(trimmedSal).replace(/"/g, '\\"');
            const q = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} practicas:salarioPreferido ?old . }\nINSERT { ${subjectRef} practicas:salarioPreferido "${toPersist}" . }\nWHERE { OPTIONAL { ${subjectRef} practicas:salarioPreferido ?old . } }`;
            await sparqlUpdate(q);
        }
    }
}

/*
export async function updateUserPreference(data) {
    const { userId } = data;
    if (!userId) throw new Error('userId requerido en updateUserPreference');

    const subjectRef = userId.startsWith('http') ? `<${userId}>` : `practicas:${String(userId).trim().replace(/[^a-zA-Z0-9_\-]/g, '_')}`;

    const triples = [];

    if (data.competencia) {
        const safeComp = String(data.competencia).trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
        triples.push(`${subjectRef} practicas:tienePreferencia practicas:${safeComp} .`);
    }

    if (typeof data.gusto !== 'undefined') {
        const val = data.gusto ? 'like' : 'dislike';
        triples.push(`${subjectRef} practicas:valorPreferencia "${String(val)}" .`);
    }

    if (data.motivo) {
        const safeMotivo = String(data.motivo).replace(/"/g, '\\"');
        triples.push(`${subjectRef} practicas:motivoInteraccion "${safeMotivo}" .`);
    }

    if (data.ofertaId) {
        const safeOferta = String(data.ofertaId).trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
        triples.push(`${subjectRef} practicas:reaccionSobre practicas:${safeOferta} .`);
    }

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

    if (data.ubicacion && typeof data.gusto !== 'undefined' && data.gusto === false) {
        const safeUb2 = String(data.ubicacion).replace(/"/g, '\\"');
        triples.push(`${subjectRef} practicas:ubicacionRechazada "${safeUb2}" .`);
    }

    try {
        if (typeof data.salario !== 'undefined' && data.salario !== null && data.salario !== '') {
            const normalized = normalizeSalary(data.salario);
            const toPersist = normalized !== null ? normalized : String(data.salario).replace(/"/g, '\\"');
            const qSal = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} practicas:salarioPreferido ?old . }\nINSERT { ${subjectRef} practicas:salarioPreferido "${toPersist}" . }\nWHERE { OPTIONAL { ${subjectRef} practicas:salarioPreferido ?old . } }`;
            await sparqlUpdate(qSal);
        } else if (data.ofertaId && data.motivo && /salari/i.test(String(data.motivo))) {
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

    if (triples.length === 0) return;

    const update = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nINSERT DATA {\n${triples.join('\n')}\n}`;
    await sparqlUpdate(update);
}*/

