import { sparqlQuery, sparqlUpdate } from "../../shared/fuseki-client.js";

export async function generarRecomendaciones(userId, options = { includeZeroMatches: false, limit: 20, preferredLocation: null }) {
    const { includeZeroMatches, limit, preferredLocation } = options || {};
    console.log(`Generando recomendaciones para usuario: ${userId} (includeZeroMatches=${includeZeroMatches}, preferredLocation=${preferredLocation})`);
    // Try to read user's salarioPreferido first so we can enforce minimum salary
    let salarioPrefValue = null;
    try {
        const qSalPref = `PREFIX practicas: <http://www.unijob.edu/practicas#> SELECT ?s WHERE { practicas:${userId} practicas:salarioPreferido ?s } LIMIT 1`;
        const rpf = await sparqlQuery(qSalPref);
        const bpf = rpf && rpf.results && rpf.results.bindings ? rpf.results.bindings : [];
        if (bpf.length > 0 && bpf[0].s && bpf[0].s.value) salarioPrefValue = bpf[0].s.value;
    } catch (e) {
        console.warn('No se pudo obtener salarioPreferido para usuario', userId, e);
    }
    // Build SPARQL query; optionally exclude offers with zero matches using HAVING
    const havingClause = includeZeroMatches ? '' : 'HAVING (COUNT(DISTINCT ?matchCompetencia) > 0)';

    // If preferredLocation is provided, compute a localMatch flag to prioritize local offers
    const escapedLoc = preferredLocation ? String(preferredLocation).replace(/"/g, '\\"') : null;
    const locationExpr = escapedLoc ? `(IF(STR(?ubicacionOferta) = "${escapedLoc}", 1, 0) AS ?localMatch)` : '';
    const orderPrefix = escapedLoc ? 'DESC(?localMatch) ' : '';

    const salaryFilterClause = salarioPrefValue ? `FILTER( BOUND(?salario) && xsd:decimal(?salario) >= xsd:decimal("${String(salarioPrefValue).replace(/"/g, '\"')}") )` : '';

    const query = `
    PREFIX practicas: <http://www.unijob.edu/practicas#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

    SELECT ?op (COUNT(DISTINCT ?matchCompetencia) AS ?matches) (GROUP_CONCAT(DISTINCT STR(?allReq); SEPARATOR="|") AS ?reqCompetencias) ?titulo ?descripcion ?modalidad ?empresaName ?ubicacionOferta ?salario ${locationExpr} WHERE {
            # candidate opportunities
            ?op rdf:type practicas:OfertaPractica .
            OPTIONAL { ?op practicas:descripcion ?descripcion }
            OPTIONAL { ?op practicas:empresa ?empresa . ?empresa practicas:nombreEmpresa ?empresaName }
            OPTIONAL { ?op practicas:titulo ?titulo }
            OPTIONAL { ?op practicas:modalidad ?modalidad }
            OPTIONAL { ?op practicas:ubicacionOferta ?ubicacionOferta }
            OPTIONAL { ?op practicas:salario ?salario }

            # collect ALL required competencies for the opportunity
            OPTIONAL { ?op practicas:requiereCompetencia ?allReq . }

            # student's explicit competencias (used to compute matches)
            practicas:${userId} practicas:poseeCompetencia ?userCompetencia .
            # link required competencias that match the student's competencias
            OPTIONAL {
                ?op practicas:requiereCompetencia ?reqCompetencia .
                FILTER(?reqCompetencia = ?userCompetencia)
                BIND(?reqCompetencia AS ?matchCompetencia)
            }

            # Exclude opportunities that the user explicitly reacted against
            FILTER NOT EXISTS { practicas:${userId} practicas:reaccionSobre ?op . }

            # Exclude matches where the user marked that competencia as 'dislike'
            FILTER NOT EXISTS {
                practicas:${userId} practicas:tienePreferencia ?reqCompetencia .
                practicas:${userId} practicas:valorPreferencia "dislike" .
            }

            # Exclude opportunities located in user's rejected locations unless modality is virtual
            FILTER NOT EXISTS {
                practicas:${userId} practicas:ubicacionRechazada ?badLoc .
                # compare offer location with rejected location and allow if modality is virtual
                FILTER( STR(?ubicacionOferta) = STR(?badLoc) && !(lcase(str(?modalidad)) = "virtual") )
            }

            ${salaryFilterClause}
        }
    GROUP BY ?op ?titulo ?descripcion ?modalidad ?empresaName ?ubicacionOferta ?salario
        ${havingClause}
        ORDER BY ${orderPrefix}DESC(?matches)
        LIMIT ${Number(limit || 20)}
    `;

    const result = await sparqlQuery(query);
    console.log(`Recomendaciones generadas para usuario ${userId}:`, result);
    // result may be SPARQL JSON; normalize to friendly objects
    const rows = (result.results && result.results.bindings) ? result.results.bindings : [];
    return rows.map(r => {
        const rawReq = r.reqCompetencias ? r.reqCompetencias.value : null;
        const reqArray = rawReq ? rawReq.split('|').map(s => s.trim()).filter(Boolean) : [];
        // convert full URIs to fragment (after # or /) for convenience
        const reqFrags = reqArray.map(u => {
            try {
                const parts = (u || '').split(/[#\/]/);
                return parts.length ? parts.pop() : u;
            } catch (e) { return u; }
        });

        return {
            opportunity: r.op ? r.op.value : null,
            matches: r.matches ? Number(r.matches.value) : 0,
            requiereCompetencia: reqFrags,
            titulo: r.titulo ? r.titulo.value : null,
            descripcion: r.descripcion ? r.descripcion.value : null,
            modalidad: r.modalidad ? r.modalidad.value : null,
            ubicacionOferta: r.ubicacionOferta ? r.ubicacionOferta.value : null,
            salario: r.salario ? r.salario.value : null,
            nombreEmpresa: r.empresaName ? r.empresaName.value : null
        };
    });
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
    console.log(`Generando y persistiendo recomendaciones para usuario: ${userId}`);
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
