import { sparqlQuery } from "../../shared/fuseki-client.js";

export async function generarRecomendaciones(userId) {
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
