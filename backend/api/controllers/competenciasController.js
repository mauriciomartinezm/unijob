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

export const listCompetencias = async (req, res) => {
  console.log("listCompetencias called");
  try {
    // Obtener todos los predicados/objetos para cada competencia y agrupar por sujeto
    const q = `${PREFIXES}
    SELECT ?competencia ?prop ?value WHERE {
      ?competencia rdf:type practicas:Competencia .
      ?competencia ?prop ?value .
    }
    ORDER BY ?competencia`;

    const result = await sparqlQuery(q);
    const bindings = parseBindings(result.results.bindings || []);

    const grouped = {};
    for (const b of bindings) {
      const uri = b.competencia || null;
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
    return res.status(500).json({ error: "Error al listar competencias" });
  }
};

export const createCompetencia = async (req, res) => {
  console.log("Creating competencia with data:", req.body);
  try {
    const { competencia, nombreCompetencia } = req.body;

    if (!competencia || !nombreCompetencia) {
      return res.status(400).json({ error: "Falta 'competencia' o 'nombreCompetencia' en el body" });
    }

    const update = `
      PREFIX practicas: <http://www.unijob.edu/practicas#>
      INSERT DATA {
        practicas:${competencia} a practicas:Competencia ;
          practicas:nombreCompetencia "${String(nombreCompetencia).replace(/"/g, '\\"')}" .
      }
    `;

    await sparqlUpdate(update);

    return res.json({ message: "Competencia creada correctamente", competencia });
  } catch (error) {
    console.error("Error createCompetencia:", error);
    return res.status(500).json({ error: "Error al crear competencia" });
  }
};

export const deleteCompetencia = async (req, res) => {
  console.log("Deleting competencia:", req.params.competencia);
  try {
    const competencia = req.params.competencia;
    if (!competencia) return res.status(400).json({ error: "Falta parámetro 'competencia'" });

    // Remove triples where the competencia is subject and where it appears as object
    const update = `
      PREFIX practicas: <http://www.unijob.edu/practicas#>
      DELETE {
        practicas:${competencia} ?p ?o .
        ?s ?pred practicas:${competencia} .
      }
      WHERE {
        { practicas:${competencia} ?p ?o . }
        UNION
        { ?s ?pred practicas:${competencia} . }
      }
    `;

    await sparqlUpdate(update);

    return res.json({ message: "Competencia eliminada correctamente", competencia });
  } catch (error) {
    console.error("Error deleteCompetencia:", error);
    return res.status(500).json({ error: "Error al eliminar competencia" });
  }
};

export const updateCompetencia = async (req, res) => {
  console.log("Updating competencia:", req.params.competencia, "with data:", req.body);
  try {
    const competencia = req.params.competencia;
    const { nombreCompetencia } = req.body;

    if (!competencia || !nombreCompetencia) {
      return res.status(400).json({ error: "Falta parámetro 'competencia' o 'nombreCompetencia' en el body" });
    }

    const update = `
      PREFIX practicas: <http://www.unijob.edu/practicas#>
      DELETE {
        practicas:${competencia} practicas:nombreCompetencia ?oldName .
      }
      INSERT {
        practicas:${competencia} practicas:nombreCompetencia "${String(nombreCompetencia).replace(/"/g, '\\"')}" .
      }
      WHERE {
        OPTIONAL { practicas:${competencia} practicas:nombreCompetencia ?oldName . }
      }
    `;

    await sparqlUpdate(update);

    return res.json({ message: "Competencia actualizada correctamente", competencia, nombreCompetencia });
  } catch (error) {
    console.error("Error updateCompetencia:", error);
    return res.status(500).json({ error: "Error al actualizar competencia" });
  }
};
