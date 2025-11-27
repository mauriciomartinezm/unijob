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

export const createCareer = async (req, res) => {
  try {
    const { id, nombreCarrera } = req.body;

    if (!id || !nombreCarrera) {
      return res.status(400).json({ error: "Falta id o nombreCarrera" });
    }

    const update = `
      PREFIX practicas: <http://www.unijob.edu/practicas#>
      INSERT DATA {
        practicas:${id} a practicas:Carrera ;
          practicas:nombreCarrera "${nombreCarrera}" .
      }
    `;

    await sparqlUpdate(update);

    return res.json({ message: "Carrera creada correctamente", id });
  } catch (error) {
    console.error("Error createCareer:", error);
    return res.status(500).json({ error: "Error al crear carrera" });
  }
};

export const updateCareer = async (req, res) => {
  try {
    const career = req.params.career;
    const { nombreCarrera } = req.body;

    if (!career || !nombreCarrera) {
      return res.status(400).json({ error: "Falta parámetro 'career' o 'nombreCarrera' en el body" });
    }

    const update = `
      PREFIX practicas: <http://www.unijob.edu/practicas#>
      DELETE { practicas:${career} practicas:nombreCarrera ?oldName . }
      INSERT { practicas:${career} practicas:nombreCarrera "${nombreCarrera}" . }
      WHERE { OPTIONAL { practicas:${career} practicas:nombreCarrera ?oldName . } }
    `;

    await sparqlUpdate(update);

    return res.json({ message: "Carrera actualizada correctamente", career, nombreCarrera });
  } catch (error) {
    console.error("Error updateCareer:", error);
    return res.status(500).json({ error: "Error al actualizar carrera" });
  }
};

export const deleteCareer = async (req, res) => {
  try {
    const career = req.params.career;
    if (!career) return res.status(400).json({ error: "Falta parámetro 'career'" });

    const update = `
      PREFIX practicas: <http://www.unijob.edu/practicas#>
      DELETE {
        practicas:${career} ?p ?o .
        ?s ?pred practicas:${career} .
      }
      WHERE {
        { practicas:${career} ?p ?o . }
        UNION
        { ?s ?pred practicas:${career} . }
      }
    `;

    await sparqlUpdate(update);

    return res.json({ message: "Carrera eliminada correctamente", career });
  } catch (error) {
    console.error("Error deleteCareer:", error);
    return res.status(500).json({ error: "Error al eliminar carrera" });
  }
};
