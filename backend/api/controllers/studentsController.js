import { sparqlQuery, sparqlUpdate } from "../../shared/fuseki-client.js";

const PREFIXES = `PREFIX practicas: <http://www.unijob.edu/practicas#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>`;

function parseBindings(bindings) {
  return bindings.map(b => {
    const obj = {};
    for (const k of Object.keys(b)) obj[k] = b[k].value;
    return obj;
  });
}

export const listStudents = async (req, res) => {
  console.log("listStudents called");
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

export const createStudent = async (req, res) => {
  try {
    const { id, nombre, carrera, competencias } = req.body;

    if (!id || !nombre) {
      return res.status(400).json({ error: "Falta id o nombre del estudiante" });
    }

    // Build INSERT DATA triples
    let triples = `
      PREFIX practicas: <http://www.unijob.edu/practicas#>
      INSERT DATA {
        practicas:${id} a practicas:Estudiante ;
          practicas:nombre "${nombre}" .
    `;

    if (carrera) {
      triples += `
        practicas:${id} practicas:perteneceACarrera practicas:${carrera} .
      `;
    }

    if (Array.isArray(competencias)) {
      for (const comp of competencias) {
        triples += `
          practicas:${id} practicas:poseeCompetencia practicas:${comp} .
        `;
      }
    }

    triples += `
      }
    `;

    await sparqlUpdate(triples);

    return res.json({ message: "Estudiante creado correctamente", id });
  } catch (error) {
    console.error("Error createStudent:", error);
    return res.status(500).json({ error: "Error al crear estudiante" });
  }
};
