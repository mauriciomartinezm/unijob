import { sparqlQuery, sparqlUpdate } from "../../shared/fuseki-client.js";

export async function generarRecomendaciones(userId) {
    console.log(`Generando recomendaciones para usuario: ${userId}`);
    // Use the practicas ontology used in the repository
    const query = `
    PREFIX practicas: <http://www.unijob.edu/practicas#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        SELECT ?op (COUNT(?matchCompetencia) AS ?matches) ?descripcion ?empresaName WHERE {
            # student's explicit competencias
            practicas:${userId} practicas:poseeCompetencia ?userCompetencia .

            # candidate opportunities
            ?op rdf:type practicas:OfertaPractica .
            OPTIONAL { ?op practicas:descripcion ?descripcion }
            OPTIONAL { ?op practicas:empresa ?empresa . ?empresa practicas:nombreEmpresa ?empresaName }

            # required competencia of opportunity
            ?op practicas:requiereCompetencia ?reqCompetencia .

            # match when required competencia equals one of the user's competencias
            FILTER(?reqCompetencia = ?userCompetencia)

            # Exclude opportunities that the user explicitly reacted against
            FILTER NOT EXISTS { practicas:${userId} practicas:reaccionSobre ?op . }

            # Exclude matches where the user marked that competencia as 'dislike'
            FILTER NOT EXISTS {
                practicas:${userId} practicas:tienePreferencia ?reqCompetencia .
                practicas:${userId} practicas:valorPreferencia "dislike" .
            }

            # helper binding to count matches
            BIND(?reqCompetencia AS ?matchCompetencia)
        }
        GROUP BY ?op ?descripcion ?empresaName
        ORDER BY DESC(?matches)
        LIMIT 20
    `;

    const result = await sparqlQuery(query);

    // result may be SPARQL JSON; normalize to friendly objects
    const rows = (result.results && result.results.bindings) ? result.results.bindings : [];
    return rows.map(r => ({
        opportunity: r.op ? r.op.value : null,
        matches: r.matches ? Number(r.matches.value) : 0,
        descripcion: r.descripcion ? r.descripcion.value : null,
        empresa: r.empresaName ? r.empresaName.value : null
    }));
}

/**
 * Genera recomendaciones para userId y las persiste en Fuseki como recursos
 * Recomendacion_<user>_<ts>_<i> con propiedades:
 *  - practicas:recomendadaPara <user>
 *  - practicas:recomienda <opportunity>
 *  - practicas:score "N"^^xsd:integer
 *  - practicas:generatedAt "ISO"^^xsd:dateTime
 */
export async function generarYpersistirRecomendaciones(userId) {
    const rows = await generarRecomendaciones(userId);

    // Normalize subject URI for user
    const userUri = userId.startsWith('http') ? userId : `http://www.unijob.edu/practicas#${userId}`;

    // Delete existing recommendation nodes for this user
    const deleteQ = `
    PREFIX practicas: <http://www.unijob.edu/practicas#>
    DELETE { ?rec ?p ?o . }
    WHERE { ?rec practicas:recomendadaPara <${userUri}> . ?rec ?p ?o . }
    `;
    try {
        await sparqlUpdate(deleteQ);
    } catch (e) {
        console.error('Error deleting old recommendations:', e);
        // continue to attempt insert
    }

    if (!rows || rows.length === 0) return [];

    // Build INSERT DATA with new recommendation nodes
    const ts = Date.now();
    let insert = `PREFIX practicas: <http://www.unijob.edu/practicas#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    INSERT DATA {\n`;

    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const opUri = r.opportunity || r.op || null;
        const matches = r.matches != null ? Number(r.matches) : (r.matches && r.matches.value ? Number(r.matches.value) : 0);
        const descripcion = r.descripcion || r.descripcion || null;

        if (!opUri) continue;

        // recommendation node id
        const safeUser = String(userId).replace(/[^a-zA-Z0-9_\-]/g, '_');
        const recId = `Recomendacion_${safeUser}_${ts}_${i}`;
        const recUri = `practicas:${recId}`;

        // op reference: use full URI if it looks like one, otherwise assume fragment
        const opRef = opUri.startsWith('http') ? `<${opUri}>` : `practicas:${opUri}`;

        insert += `  ${recUri} a practicas:Recomendacion ;\n`;
        insert += `    practicas:recomendadaPara <${userUri}> ;\n`;
        insert += `    practicas:recomienda ${opRef} ;\n`;
        insert += `    practicas:score "${matches}"^^xsd:integer ;\n`;
        insert += `    practicas:generatedAt "${new Date(ts).toISOString()}"^^xsd:dateTime .\n`;
        if (descripcion) {
            const esc = String(descripcion).replace(/"/g, '\\"');
            insert += `    ${recUri} practicas:descripcion "${esc}" .\n`;
        }
    }

    insert += `}`;

    try {
        await sparqlUpdate(insert);
    } catch (e) {
        console.error('Error inserting recommendations:', e);
        throw e;
    }

    return rows;
}
