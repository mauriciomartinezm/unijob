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

export const listSkills = async (req, res) => {
  console.log("listSkills called");
  try {
    const q = `${PREFIXES}
    SELECT ?skill ?skillName WHERE {
      ?skill rdf:type practicas:Competencia .
      OPTIONAL { ?skill practicas:nombreCompetencia ?skillName }
    }`;

    const result = await sparqlQuery(q);
    const rows = parseBindings(result.results.bindings);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al listar competencias" });
  }
};

export const createSkill = async (req, res) => {
  console.log("Creating skill with data:", req.body);
  try {
    const { skill, skillName } = req.body;

    if (!skill || !skillName) {
      return res.status(400).json({ error: "Falta 'skill' o 'skillName' en el body" });
    }

    const update = `
      PREFIX practicas: <http://www.unijob.edu/practicas#>
      INSERT DATA {
        practicas:${skill} a practicas:Competencia ;
          practicas:nombreCompetencia "${skillName}" .
      }
    `;

    await sparqlUpdate(update);

    return res.json({ message: "Competencia creada correctamente", skill });
  } catch (error) {
    console.error("Error createSkill:", error);
    return res.status(500).json({ error: "Error al crear competencia" });
  }
};

export const deleteSkill = async (req, res) => {
  console.log("Deleting skill:", req.params.skill);
  try {
    const skill = req.params.skill;
    if (!skill) return res.status(400).json({ error: "Falta parámetro 'skill'" });

    // Remove triples where the skill is subject and where it appears as object
    const update = `
      PREFIX practicas: <http://www.unijob.edu/practicas#>
      DELETE {
        practicas:${skill} ?p ?o .
        ?s ?pred practicas:${skill} .
      }
      WHERE {
        { practicas:${skill} ?p ?o . }
        UNION
        { ?s ?pred practicas:${skill} . }
      }
    `;

    await sparqlUpdate(update);

    return res.json({ message: "Competencia eliminada correctamente", skill });
  } catch (error) {
    console.error("Error deleteSkill:", error);
    return res.status(500).json({ error: "Error al eliminar competencia" });
  }
};

export const updateSkill = async (req, res) => {
  console.log("Updating skill:", req.params.skill, "with data:", req.body);
  try {
    const skill = req.params.skill;
    const { skillName } = req.body;

    if (!skill || !skillName) {
      return res.status(400).json({ error: "Falta parámetro 'skill' o 'skillName' en el body" });
    }

    const update = `
      PREFIX practicas: <http://www.unijob.edu/practicas#>
      DELETE {
        practicas:${skill} practicas:nombreCompetencia ?oldName .
      }
      INSERT {
        practicas:${skill} practicas:nombreCompetencia "${skillName}" .
      }
      WHERE {
        OPTIONAL { practicas:${skill} practicas:nombreCompetencia ?oldName . }
      }
    `;

    await sparqlUpdate(update);

    return res.json({ message: "Competencia actualizada correctamente", skill, skillName });
  } catch (error) {
    console.error("Error updateSkill:", error);
    return res.status(500).json({ error: "Error al actualizar competencia" });
  }
};
