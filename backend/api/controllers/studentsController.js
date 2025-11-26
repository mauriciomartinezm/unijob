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
    const rows = parseBindings(result.results.bindings).map(r => {
      const uri = r.student || null;
      let identificador = null;
      if (uri) {
        // extraer fragmento después de # o la última / como identificador legible
        const m = uri.match(/[#\/](.+)$/);
        identificador = m ? m[1] : uri;
      }
      return {
        identificador,
        uri,
        nombre: r.nombre || '',
        carrera: r.carreraName || ''
      };
    });

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
    const { id, nombre, carrera, competencias, cedula } = req.body;

    if (!id || !nombre) {
      return res.status(400).json({ error: "Falta id o nombre del estudiante" });
    }

    // sanitize id to be a safe fragment (replace spaces and bad chars)
    const safeId = String(id).trim().replace(/[^a-zA-Z0-9_\-]/g, '_');

    // Build INSERT DATA triples (use practicas: prefix and Spanish property names)
    // Also store la cédula si fue proporcionada
    let triples = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nINSERT DATA {\n  practicas:${safeId} a practicas:Estudiante ;\n    practicas:nombre "${String(nombre).replace(/"/g, '\\"')}" .\n`;

    if (cedula) {
      const safeCedula = String(cedula).trim().replace(/"/g, '\\"');
      triples += `  practicas:${safeId} practicas:cedula "${safeCedula}" .\n`;
    }

    if (carrera) {
      const safeCarrera = String(carrera).trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
      triples += `  practicas:${safeId} practicas:perteneceACarrera practicas:${safeCarrera} .\n`;
    }

    if (Array.isArray(competencias)) {
      for (const comp of competencias) {
        if (!comp) continue;
        const safeComp = String(comp).trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
        triples += `  practicas:${safeId} practicas:poseeCompetencia practicas:${safeComp} .\n`;
      }
    }

    triples += `}`;

    await sparqlUpdate(triples);

    // return the created resource URI in Spanish
    const uri = `http://www.unijob.edu/practicas#${safeId}`;
    return res.json({ mensaje: "Estudiante creado correctamente", id: safeId, uri });
  } catch (error) {
    console.error("Error createStudent:", error);
    return res.status(500).json({ error: "Error al crear estudiante" });
  }
};
