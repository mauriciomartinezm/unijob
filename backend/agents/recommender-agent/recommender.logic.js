import { sparqlQuery, sparqlUpdate } from "../../shared/fuseki-client.js";

export async function generarRecomendaciones(userId, options = { includeZeroMatches: false, limit: 20, preferredLocation: null, salaryTolerance: 0.1 }) {
    const { includeZeroMatches, limit, preferredLocation, salaryTolerance = 0.1 } = options || {};
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

    // Try to read user's modalidadPreferida so we can prioritize by modality
    let modalidadPrefValue = null;
    try {
        const qModPref = `PREFIX practicas: <http://www.unijob.edu/practicas#> SELECT ?m WHERE { practicas:${userId} practicas:modalidadPreferida ?m } LIMIT 1`;
        const rmp = await sparqlQuery(qModPref);
        const bmp = rmp && rmp.results && rmp.results.bindings ? rmp.results.bindings : [];
        if (bmp.length > 0 && bmp[0].m && bmp[0].m.value) modalidadPrefValue = bmp[0].m.value;
    } catch (e) {
        console.warn('No se pudo obtener modalidadPreferida para usuario', userId, e);
    }

    // Build salary filter clause early so it can be used by the "preferences-only" path.
    // New behavior: instead of requiring offers to be >= salarioPreferido, recommend offers around that salary
    // using a tolerance (percentage). Default tolerance = 0.1 (±10%). Caller may override via options.salaryTolerance.
    // We try to coerce the stored salarioPreferido to a numeric value (strip non-digits) before computing the window.
    let salaryFilterClause = '';
    let selectSalaryNum = '';
    let salaryOrderClause = '';
    // store a normalized base string for salary scoring when available
    let salaryBaseStr = null;
    if (salarioPrefValue) {
        try {
            const raw = String(salarioPrefValue || '').replace(/[^0-9.\-]/g, '');
            const base = Number(raw);
            if (!Number.isNaN(base)) {
                const tol = (typeof salaryTolerance === 'number' && salaryTolerance >= 0) ? Number(salaryTolerance) : 0.1;
                const minVal = (base * (1 - tol));
                const maxVal = (base * (1 + tol));
                // format without grouping, keep decimals if present
                const minStr = String(Number(minVal.toFixed(2)));
                const maxStr = String(Number(maxVal.toFixed(2)));
                const baseStr = String(Number(base.toFixed(2)));
                // We will not strictly filter by salary; instead compute a numeric aggregate and
                // order by a salary-based priority: first offers >= base, then within tolerance,
                // then lower ones ordered by distance to base. We still keep salaryFilterClause empty
                // so that all offers are considered but prioritized.
                selectSalaryNum = `(MAX(xsd:decimal(?salario)) AS ?salarioNum)`;
                // Build an ORDER BY fragment (no trailing commas) that:
                // - ranks offers >= base first (priority 2), then within tolerance (1), then others (0)
                // - within each priority orders by closeness to base (absolute difference)
                salaryOrderClause = `DESC( IF( BOUND(?salarioNum) && ?salarioNum >= xsd:decimal("${baseStr}"), 2, IF( BOUND(?salarioNum) && ?salarioNum >= xsd:decimal("${minStr}") && ?salarioNum <= xsd:decimal("${maxStr}"), 1, 0) ) ) ASC(ABS(?salarioNum - xsd:decimal("${baseStr}"))) `;
                salaryBaseStr = baseStr;
                // Do not set a hard filter; allow recommendations above base as well.
                salaryFilterClause = '';
            } else {
                // fallback: no filter if parsing failed
                salaryFilterClause = '';
            }
        } catch (e) {
            console.warn('Error construyendo salaryFilterClause por salarioPreferido:', e);
            salaryFilterClause = '';
        }
    }

    // Build modality ordering fragment: preferred modality first, then 'mixta', then others
    let modalidadOrderClause = '';
    let prefModalLower = null;
    if (modalidadPrefValue) {
        const prefLower = String(modalidadPrefValue).toLowerCase().replace(/"/g, '\\"');
        modalidadOrderClause = `DESC( IF( lcase(str(?modalidad)) = "${prefLower}", 2, IF( lcase(str(?modalidad)) = "mixta", 1, 0 ) ) ) `;
        prefModalLower = prefLower;
    }

    // If preferredLocation is provided, precompute escapedLoc and ordering helpers early
    const escapedLoc = preferredLocation ? String(preferredLocation).replace(/"/g, '\\"') : null;
    const locationExpr = escapedLoc ? `(IF(STR(?ubicacionOferta) = "${escapedLoc}", 1, 0) AS ?localMatch)` : '';
    const orderPrefix = escapedLoc ? 'DESC(?localMatch) ' : '';

    // Build score component expressions to compute a combined score in SPARQL
    // Competency score: matches / totalReq (0 if no required competencies)
    const competencyScoreExpr = `(IF( BOUND(?totalReq) && xsd:decimal(?totalReq) > 0, (xsd:decimal(?matches) / xsd:decimal(?totalReq)), 0 ))`;
    // Modalidad score: 1 = preferred, 0.5 = mixta, 0 = others
    const modalidadScoreExpr = prefModalLower ? `IF( lcase(str(?modalidad)) = "${prefModalLower}", 1, IF( lcase(str(?modalidad)) = "mixta", 0.5, 0 ) )` : '0';
    // Salary score: 1 if >= base, otherwise 1 - (base - salarioNum)/base, clamped to >=0
    let salaryScoreExpr = '0';
    if (salaryBaseStr) {
        salaryScoreExpr = `IF( BOUND(?salarioNum), IF( ?salarioNum >= xsd:decimal("${salaryBaseStr}"), 1, IF( ?salarioNum > 0, IF( (1 - ((xsd:decimal("${salaryBaseStr}") - ?salarioNum) / xsd:decimal("${salaryBaseStr}"))) < 0, 0, (1 - ((xsd:decimal("${salaryBaseStr}") - ?salarioNum) / xsd:decimal("${salaryBaseStr}")) ) ), 0) ), 0)`;
    }
    // localMatch is provided by locationExpr as ?localMatch when escapedLoc set; default 0 otherwise
    const localMatchExpr = escapedLoc ? 'IF( BOUND(?localMatch), ?localMatch, 0 )' : '0';
    // Combined weighted score expression — restored to recommended weights:
    // Competencias: 45% (0.45), Ubicación: 25% (0.25), Modalidad: 20% (0.20), Salario: 10% (0.10)
    const combinedScoreExpr = `(( ${competencyScoreExpr} * 0.45 ) + ( ${localMatchExpr} * 0.25 ) + ( ${modalidadScoreExpr} * 0.20 ) + ( ${salaryScoreExpr} * 0.10 ))`;

    // Determine if the user has ANY competencias or explicit preferences recorded.
    // If the user has neither, consider them a first-time user and return all offers.
    let cCount = 0;
    let pCount = 0;
    try {
        const qCheck = `PREFIX practicas: <http://www.unijob.edu/practicas#>
            SELECT (COUNT(DISTINCT ?c) AS ?cCount) (COUNT(DISTINCT ?p) AS ?pCount) WHERE {
                OPTIONAL { practicas:${userId} practicas:poseeCompetencia ?c }
                OPTIONAL {
                    { practicas:${userId} practicas:ubicacionPreferida ?p }
                    UNION { practicas:${userId} practicas:modalidadPreferida ?p }
                    UNION { practicas:${userId} practicas:salarioPreferido ?p }
                }
            } LIMIT 1`;
        const chk = await sparqlQuery(qCheck);
        const bindings = chk && chk.results && chk.results.bindings ? chk.results.bindings : [];
        if (bindings.length > 0) {
            const b = bindings[0];
            cCount = b.cCount ? Number(b.cCount.value) : 0;
            pCount = b.pCount ? Number(b.pCount.value) : 0;
        }
    } catch (e) {
        console.warn('No se pudo verificar si el usuario tiene competencias/preferencias', userId, e);
        // leave cCount/pCount as 0 (conservative); but avoid returning everything on error by
        // treating as if user has prefs to fall into the guarded path below.
        cCount = 0;
        pCount = 1; // force preference path on error
    }

    // If the user has no competencias and no preferences, return ALL offers (no filtering by user data).
    if ((cCount + pCount) === 0) {
        const allQuery = `
        PREFIX practicas: <http://www.unijob.edu/practicas#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        SELECT ?op (GROUP_CONCAT(DISTINCT STR(?allReq); SEPARATOR="|") AS ?reqCompetencias) ?titulo ?descripcion ?modalidad ?empresaName ?ubicacionOferta ?salario WHERE {
            ?op rdf:type practicas:OfertaPractica .
            OPTIONAL { ?op practicas:descripcion ?descripcion }
            OPTIONAL { ?op practicas:empresa ?empresa . ?empresa practicas:nombreEmpresa ?empresaName }
            OPTIONAL { ?op practicas:titulo ?titulo }
            OPTIONAL { ?op practicas:modalidad ?modalidad }
            OPTIONAL { ?op practicas:ubicacionOferta ?ubicacionOferta }
            OPTIONAL { ?op practicas:salario ?salario }
            OPTIONAL { ?op practicas:requiereCompetencia ?allReq }
        }
        GROUP BY ?op ?titulo ?descripcion ?modalidad ?empresaName ?ubicacionOferta ?salario
        ORDER BY DESC(?op)
        LIMIT ${Number(limit || 20)}
        `;

        const resAll = await sparqlQuery(allQuery);
        const rowsAll = (resAll && resAll.results && resAll.results.bindings) ? resAll.results.bindings : [];
        return rowsAll.map(r => {
            const rawReq = r.reqCompetencias ? r.reqCompetencias.value : null;
            const reqArray = rawReq ? rawReq.split('|').map(s => s.trim()).filter(Boolean) : [];
            const reqFrags = reqArray.map(u => {
                try { const parts = (u || '').split(/[#\/]/); return parts.length ? parts.pop() : u; } catch (e) { return u; }
            });
            return {
                opportunity: r.op ? r.op.value : null,
                matches: 0,
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

    // If the user has preferences but NO competencias, return offers filtered by preferences
    // (e.g., salarioPreferido, ubicacionRechazada, modalidadPreferida) but do NOT require
    // a competencia match. This avoids returning zero results for users who only set prefs.
    if (cCount === 0 && pCount > 0) {
        // Build a query similar to the main one but without requiring the user to have a competencia
    const prefQuery = `
    PREFIX practicas: <http://www.unijob.edu/practicas#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

    SELECT ?op ${selectSalaryNum} (COUNT(DISTINCT ?matchCompetencia) AS ?matches) (COUNT(DISTINCT ?allReq) AS ?totalReq) (GROUP_CONCAT(DISTINCT STR(?allReq); SEPARATOR="|") AS ?reqCompetencias) ${locationExpr} (${combinedScoreExpr} AS ?score) ?titulo ?descripcion ?modalidad ?empresaName ?ubicacionOferta ?salario WHERE {
            ?op rdf:type practicas:OfertaPractica .
            OPTIONAL { ?op practicas:descripcion ?descripcion }
            OPTIONAL { ?op practicas:empresa ?empresa . ?empresa practicas:nombreEmpresa ?empresaName }
            OPTIONAL { ?op practicas:titulo ?titulo }
            OPTIONAL { ?op practicas:modalidad ?modalidad }
            OPTIONAL { ?op practicas:ubicacionOferta ?ubicacionOferta }
            OPTIONAL { ?op practicas:salario ?salario }
            OPTIONAL { ?op practicas:requiereCompetencia ?allReq }

            # Exclude opportunities that the user explicitly reacted against
            FILTER NOT EXISTS { practicas:${userId} practicas:reaccionSobre ?op . }

            # Exclude opportunities located in user's rejected locations unless modality is virtual
            FILTER NOT EXISTS {
                practicas:${userId} practicas:ubicacionRechazada ?badLoc .
                FILTER( STR(?ubicacionOferta) = STR(?badLoc) && !(lcase(str(?modalidad)) = "virtual") )
            }

            ${salaryFilterClause}
        }
    GROUP BY ?op ?titulo ?descripcion ?modalidad ?empresaName ?ubicacionOferta ?salario
    ORDER BY DESC(?score) DESC(?matches) DESC(?op)
        LIMIT ${Number(limit || 20)}
        `;

        // Do not restrict to preferredLocation only; the unrestricted prefQuery already
        // includes a local-match component so local offers will be prioritized while
        // keeping non-local offers in the result set.

        const resPref = await sparqlQuery(prefQuery);
        const rowsPref = (resPref && resPref.results && resPref.results.bindings) ? resPref.results.bindings : [];
        return rowsPref.map(r => {
            const rawReq = r.reqCompetencias ? r.reqCompetencias.value : null;
            const reqArray = rawReq ? rawReq.split('|').map(s => s.trim()).filter(Boolean) : [];
            const reqFrags = reqArray.map(u => { try { const parts = (u || '').split(/[#\/]/); return parts.length ? parts.pop() : u; } catch (e) { return u; } });
            return {
                opportunity: r.op ? r.op.value : null,
                matches: r.matches ? Number(r.matches.value) : 0,
                score: r.score ? Number(r.score.value) : null,
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
    // Build SPARQL query; optionally exclude offers with zero matches using HAVING
    const havingClause = includeZeroMatches ? '' : 'HAVING (COUNT(DISTINCT ?matchCompetencia) > 0)';

    // preferredLocation helpers (defined earlier)

    

    const query = `
    PREFIX practicas: <http://www.unijob.edu/practicas#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

    SELECT ?op ${selectSalaryNum} (COUNT(DISTINCT ?matchCompetencia) AS ?matches) (COUNT(DISTINCT ?allReq) AS ?totalReq) (GROUP_CONCAT(DISTINCT STR(?allReq); SEPARATOR="|") AS ?reqCompetencias) ${locationExpr} (${combinedScoreExpr} AS ?score) ?titulo ?descripcion ?modalidad ?empresaName ?ubicacionOferta ?salario WHERE {
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
        ORDER BY DESC(?score) DESC(?matches)
        LIMIT ${Number(limit || 20)}
    `;

    // Always run the unrestricted query which includes ?localMatch in the combined score so
    // local offers are prioritized but non-local offers remain present.
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
            score: r.score ? Number(r.score.value) : null,
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
        // prefer the computed score when available, otherwise fall back to matches
        const scoreToPersist = (typeof r.score !== 'undefined' && r.score !== null && !Number.isNaN(Number(r.score))) ? Number(r.score) : matches;
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
    insert += `    practicas:score "${scoreToPersist}"^^xsd:decimal ;\n`;
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
