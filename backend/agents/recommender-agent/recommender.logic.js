import { sparqlQuery } from "../../shared/fuseki-client.js";

export async function generarRecomendaciones(userId) {
    // Use the practicas ontology used in the repository
    const query = `
    PREFIX practicas: <http://www.unijob.edu/practicas#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        SELECT ?op (COUNT(?match) AS ?matches) ?descripcion ?empresaName WHERE {
            # student's explicit competencies
            practicas:${userId} practicas:poseeCompetencia ?userSkill .

            # candidate opportunities
            ?op rdf:type practicas:OportunidadLaboral .
            OPTIONAL { ?op practicas:descripcionOportunidad ?descripcion }
            OPTIONAL { ?op practicas:ofrecidaPor ?empresa . ?empresa practicas:nombreEmpresa ?empresaName }

            # required skill of opportunity
            ?op practicas:requiereCompetencia ?reqSkill .

            # match when required skill equals one of the user's skills
            FILTER(?reqSkill = ?userSkill)

            # helper binding to count matches
            BIND(?reqSkill AS ?match)
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
