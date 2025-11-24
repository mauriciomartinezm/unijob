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

export const listCareers = async (req, res) => {
  try {
    const q = `${PREFIXES}
    SELECT ?career ?nombreCarrera WHERE {
      ?career rdf:type practicas:Carrera .
      OPTIONAL { ?career practicas:nombreCarrera ?nombreCarrera }
    }`;

    const result = await sparqlQuery(q);
    const rows = parseBindings(result.results.bindings);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al listar carreras" });
  }
};
