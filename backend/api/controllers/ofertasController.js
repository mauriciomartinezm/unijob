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

export const listOpportunities = async (req, res) => {
  try {
    // Obtener todos los predicados/objetos para cada oferta y agrupar por sujeto
    const q = `${PREFIXES}
    SELECT ?op ?prop ?value WHERE {
      ?op rdf:type practicas:OfertaPractica .
      ?op ?prop ?value .
    }
    ORDER BY ?op`;

    const result = await sparqlQuery(q);
    const bindings = parseBindings(result.results.bindings || []);

    const grouped = {};
    for (const b of bindings) {
      const uri = b.op || null;
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
    return res.status(500).json({ error: "Error al listar oportunidades" });
  }
};

export const createOpportunity = async (req, res) => {
  try {
    const { id, titulo, descripcion, modalidad, empresa, competencias } = req.body;

    if (!id || !titulo) {
      return res.status(400).json({ error: "Falta 'id' o 'titulo' en el body" });
    }

    const safeId = String(id).trim().replace(/[^a-zA-Z0-9_\-]/g, '_');

    let insert = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nINSERT DATA {\n  practicas:${safeId} a practicas:OfertaPractica ;\n    practicas:titulo "${String(titulo).replace(/"/g, '\\"')}" .\n`;

    if (descripcion) {
      insert += `  practicas:${safeId} practicas:descripcion "${String(descripcion).replace(/"/g, '\\"')}" .\n`;
    }

    if (modalidad) {
      insert += `  practicas:${safeId} practicas:modalidad "${String(modalidad).replace(/"/g, '\\"')}" .\n`;
    }

    if (empresa) {
      const safeEmpresa = String(empresa).trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
      insert += `  practicas:${safeId} practicas:empresa practicas:${safeEmpresa} .\n`;
    }

    if (Array.isArray(competencias)) {
      for (const c of competencias) {
        if (!c) continue;
        const safeC = String(c).trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
        insert += `  practicas:${safeId} practicas:requiereCompetencia practicas:${safeC} .\n`;
      }
    }

    insert += `}`;

    await sparqlUpdate(insert);

    const uri = `http://www.unijob.edu/practicas#${safeId}`;
    return res.json({ message: 'Oferta creada correctamente', id: safeId, uri });
  } catch (error) {
    console.error('Error createOpportunity:', error);
    return res.status(500).json({ error: 'Error al crear oferta' });
  }
};
