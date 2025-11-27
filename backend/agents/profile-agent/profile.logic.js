import { sparqlUpdate } from "../../shared/fuseki-client.js";

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

    if (triples.length === 0) return; // nothing to persist

    const update = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nINSERT DATA {\n${triples.join('\n')}\n}`;
    await sparqlUpdate(update);
}

export async function updateUserPreferences(data) {
    // data = { userId, ubicacion?, modalidad?, salario? }
    const { userId } = data;
    if (!userId) throw new Error('userId requerido');

    // Helper to build subject reference (allow full URI or fragment)
    const subjectRef = userId.startsWith('http') ? `<${userId}>` : `practicas:${String(userId).trim().replace(/[^a-zA-Z0-9_\-]/g, '_')}`;
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
        const safe = String(data.salario).replace(/"/g, '\\"');
        const q = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} practicas:salarioPreferido ?old . }\nINSERT { ${subjectRef} practicas:salarioPreferido "${safe}" . }\nWHERE { OPTIONAL { ${subjectRef} practicas:salarioPreferido ?old . } }`;
        await sparqlUpdate(q);
    }
}
