import { sparqlQuery } from "../../shared/fuseki-client.js";

const PREFIXES = `PREFIX practicas: <http://www.ejemplo.org/practicas#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>`;

function parseBindings(bindings) {
  return bindings.map(b => {
    const obj = {};
    for (const k of Object.keys(b)) obj[k] = b[k].value;
    return obj;
  });
}

export const recommendBySkills = async (req, res) => {
  try {
    const id = req.params.id;
    const subject = id.startsWith('http') ? `<${id}>` : `practicas:${id}`;

    const q = `${PREFIXES}
    SELECT ?op (COUNT(?skill) AS ?matches) ?descripcion WHERE {
      ${subject} practicas:poseeCompetencia ?userSkill .
      ?op rdf:type practicas:OportunidadLaboral .
      OPTIONAL { ?op practicas:descripcionOportunidad ?descripcion }
      ?op practicas:requiereCompetencia ?reqSkill .
      FILTER(?reqSkill = ?userSkill)
    }
    GROUP BY ?op ?descripcion
    ORDER BY DESC(?matches)
    LIMIT 10`;

    const result = await sparqlQuery(q);
    const rows = parseBindings(result.results.bindings).map(r => ({
      opportunity: r.op,
      matches: Number(r.matches || 0),
      descripcion: r.descripcion || ''
    }));

    return res.json({ user: id, recommendations: rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al generar recomendaciones" });
  }
};
