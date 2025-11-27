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
    // Obtener todos los predicados/objetos para cada carrera y agrupar por sujeto
    const q = `${PREFIXES}
    SELECT ?career ?prop ?value WHERE {
      ?career rdf:type practicas:Carrera .
      ?career ?prop ?value .
    }
    ORDER BY ?career`;

    const result = await sparqlQuery(q);
    const bindings = parseBindings(result.results.bindings || []);

    const grouped = {};
    for (const b of bindings) {
      const uri = b.career || null;
      if (!uri) continue;
      if (!grouped[uri]) grouped[uri] = { uri, propiedades: {} };

      const propUri = b.prop || '';
      const rawValue = b.value || '';

      let propKey = propUri;
      const practicasNs = 'http://www.unijob.edu/practicas#';
      if (propUri.startsWith(practicasNs)) propKey = propUri.slice(practicasNs.length);
      else {
        const m2 = propUri.match(/[#\/](.+)$/);
        propKey = m2 ? m2[1] : propUri;
      }

      if (!grouped[uri].propiedades[propKey]) grouped[uri].propiedades[propKey] = [];
      grouped[uri].propiedades[propKey].push(rawValue);
    }

    const rows = Object.values(grouped);
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
