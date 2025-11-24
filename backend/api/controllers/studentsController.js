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

export const listStudents = async (req, res) => {
  try {
    const q = `${PREFIXES}
    SELECT ?student ?nombre ?carreraName WHERE {
      ?student rdf:type practicas:Estudiante .
      OPTIONAL { ?student practicas:nombre ?nombre }
      OPTIONAL { ?student practicas:perteneceACarrera ?c . ?c practicas:nombreCarrera ?carreraName }
    }`;

    const result = await sparqlQuery(q);
    const rows = parseBindings(result.results.bindings);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al listar estudiantes" });
  }
};

export const getStudent = async (req, res) => {
  try {
    const id = req.params.id;
    const subject = id.startsWith('http') ? `<${id}>` : `practicas:${id}`;

    const q = `${PREFIXES}
    SELECT ?prop ?value WHERE { ${subject} ?prop ?value . }`;

    const result = await sparqlQuery(q);
    const rows = parseBindings(result.results.bindings);
    return res.json({ subject: id, triples: rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al obtener estudiante" });
  }
};
