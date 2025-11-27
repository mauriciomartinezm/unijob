import { sparqlQuery, sparqlUpdate } from "../../shared/fuseki-client.js";
import { perfilAgent } from "../../agents/profile-agent/index.js";

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
    // Obtener todos los predicados/objetos para cada estudiante
    const q = `${PREFIXES}
    SELECT ?student ?prop ?value WHERE {
      ?student rdf:type practicas:Estudiante .
      ?student ?prop ?value .
    }
    ORDER BY ?student`;

    const result = await sparqlQuery(q);
    const bindings = parseBindings(result.results.bindings);

    // Agrupar por sujeto (student)
    const grouped = {};
    for (const b of bindings) {
      const uri = b.student || null;
      if (!uri) continue;
      if (!grouped[uri]) {
        grouped[uri] = { uri, propiedades: {} };
      }

      const propUri = b.prop || '';
      const rawValue = b.value || '';

      // Normalizar nombre de la propiedad (usar fragmento si pertenece al prefijo practicas)
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

    // Convertir grouped a array
    const rows = Object.values(grouped);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al listar estudiantes" });
  }
};

export const getStudent = async (req, res) => {
  console.log("getStudent called with id:", req.params.id);
  try {
    const id = req.params.id;
    const subject = id.startsWith('http') ? `<${id}>` : `practicas:${id}`;

    const q = `${PREFIXES}
    SELECT ?prop ?value WHERE { ${subject} ?prop ?value . }`;

    const result = await sparqlQuery(q);
    const bindings = parseBindings(result.results.bindings);

    // Agrupar propiedades igual que en listStudents
    const propiedades = {};
    for (const b of bindings) {
      const propUri = b.prop || '';
      const rawValue = b.value || '';
      let propKey = propUri;
      const practicasNs = 'http://www.unijob.edu/practicas#';
      if (propUri.startsWith(practicasNs)) propKey = propUri.slice(practicasNs.length);
      else {
        const m2 = propUri.match(/[#\/](.+)$/);
        propKey = m2 ? m2[1] : propUri;
      }
      if (!propiedades[propKey]) propiedades[propKey] = [];
      propiedades[propKey].push(rawValue);
    }

    // Build uri value
    const uri = id.startsWith('http') ? id : `http://www.unijob.edu/practicas#${id}`;
    if (Object.keys(propiedades).length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado', uri });
    }

    return res.json({ uri, propiedades });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al obtener estudiante" });
  }
};

export const updateStudent = async (req, res) => {
  console.log("updateStudent called with id:", req.params.id, "and body:", req.body);
  try {
    const id = req.params.id;
    const { nombre, carrera, competencias, cedula, telefono, ubicacion } = req.body;

    if (!nombre && !carrera && !competencias && !cedula && !telefono && !ubicacion) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
    }

    const subjectRef = id.startsWith('http') ? `<${id}>` : `practicas:${id}`;

    // If cedula is being updated, ensure uniqueness (allow if it belongs to the same subject)
    if (cedula) {
      const safeCedula = String(cedula).trim().replace(/"/g, '\\"');
      const checkQuery = `${PREFIXES}\nSELECT ?s WHERE { ?s practicas:cedula "${safeCedula}" . } LIMIT 1`;
      const exists = await sparqlQuery(checkQuery);
      const bindings = exists && exists.results && exists.results.bindings ? exists.results.bindings : [];
      if (bindings.length > 0) {
        const existingUri = bindings[0].s && bindings[0].s.value ? bindings[0].s.value : null;
        // If existingUri is different from the subject we're updating, conflict
        const currentUri = id.startsWith('http') ? id : `http://www.unijob.edu/practicas#${id}`;
        if (existingUri !== currentUri) {
          return res.status(409).json({ error: 'Otra entidad ya tiene esa cédula', existente: existingUri });
        }
      }
    }

    // Perform updates per-field
    if (typeof nombre !== 'undefined') {
      const q = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} practicas:nombre ?oldName . }\nINSERT { ${subjectRef} practicas:nombre "${String(nombre).replace(/"/g, '\\"')}" . }\nWHERE { OPTIONAL { ${subjectRef} practicas:nombre ?oldName . } }`;
      await sparqlUpdate(q);
    }

    if (typeof carrera !== 'undefined') {
      const safeCarrera = String(carrera).trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
      const q = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} practicas:perteneceACarrera ?oldC . }\nINSERT { ${subjectRef} practicas:perteneceACarrera practicas:${safeCarrera} . }\nWHERE { OPTIONAL { ${subjectRef} practicas:perteneceACarrera ?oldC . } }`;
      await sparqlUpdate(q);
    }

    if (typeof telefono !== 'undefined') {
      const safeTelefono = String(telefono).trim().replace(/"/g, '\\"');
      const q = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} practicas:telefono ?old . }\nINSERT { ${subjectRef} practicas:telefono "${safeTelefono}" . }\nWHERE { OPTIONAL { ${subjectRef} practicas:telefono ?old . } }`;
      await sparqlUpdate(q);
    }

    if (typeof ubicacion !== 'undefined') {
      const safeUbicacion = String(ubicacion).trim().replace(/"/g, '\\"');
      const q = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} practicas:ubicacion ?old . }\nINSERT { ${subjectRef} practicas:ubicacion "${safeUbicacion}" . }\nWHERE { OPTIONAL { ${subjectRef} practicas:ubicacion ?old . } }`;
      await sparqlUpdate(q);
    }

    if (typeof competencias !== 'undefined') {
      // remove existing competencias and insert provided ones
      const deleteQ = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} practicas:poseeCompetencia ?oldComp . }\nWHERE { OPTIONAL { ${subjectRef} practicas:poseeCompetencia ?oldComp . } }`;
      await sparqlUpdate(deleteQ);
      if (Array.isArray(competencias) && competencias.length > 0) {
        let insertQ = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nINSERT DATA {\n`;
        for (const comp of competencias) {
          if (!comp) continue;
          const safeComp = String(comp).trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
          insertQ += `  ${subjectRef} practicas:poseeCompetencia practicas:${safeComp} .\n`;
        }
        insertQ += `}`;
        await sparqlUpdate(insertQ);
        // Emitir evento informativo por cada competencia añadida (no es una "preferencia")
        try {
          const userId = id.startsWith('http') ? id.split(/[#\\/]/).pop() : id;
          for (const comp of competencias) {
            if (!comp) continue;
            const safeComp = String(comp).trim().replace(/[^a-zA-Z0-9_\\-]/g, '_');
            try {
              // señalamos que el usuario posee/tuvo una competencia, sin tratarla como preferencia
              perfilAgent.emit('competencia_agregada', { userId, competencia: safeComp });
            } catch (e) {
              console.error('Error emitiendo competencia_agregada desde estudiantesController:', e);
            }
          }
          try { perfilAgent.emit('usuario_actualizado', { userId }); } catch (e) { console.error('Error emitiendo usuario_actualizado desde estudiantesController:', e); }
        } catch (emitErr) {
          console.error('Error preparando emisión de eventos de competencias (update):', emitErr);
        }
      }
    }

    if (typeof cedula !== 'undefined') {
      const safeCedula = String(cedula).trim().replace(/"/g, '\\"');
      const q = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} practicas:cedula ?old . }\nINSERT { ${subjectRef} practicas:cedula "${safeCedula}" . }\nWHERE { OPTIONAL { ${subjectRef} practicas:cedula ?old . } }`;
      await sparqlUpdate(q);
    }

    // Notify profile agent that this user's profile changed (use cedula as identifier)
    try {
      let userCedula;
      if (typeof cedula !== 'undefined' && cedula) {
        userCedula = String(cedula).trim().replace(/"/g, '\\"');
      } else {
        userCedula = id.startsWith('http') ? id.split(/[#\/]/).pop() : id;
      }
      try { perfilAgent.emit('usuario_actualizado', { cedula: userCedula }); } catch (e) { console.error('Error emitiendo usuario_actualizado desde estudiantesController (final):', e); }
    } catch (emitErr) {
      console.error('Error preparando emisión de usuario_actualizado (final):', emitErr);
    }

    return res.json({ mensaje: 'Estudiante actualizado correctamente', sujeto: subjectRef });
  } catch (error) {
    console.error('Error updateStudent:', error);
    return res.status(500).json({ error: 'Error al actualizar estudiante' });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Falta parámetro 'id'" });

    const subjectRef = id.startsWith('http') ? `<${id}>` : `practicas:${id}`;

    const update = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjectRef} ?p ?o . ?s ?pred ${subjectRef} . }\nWHERE { { ${subjectRef} ?p ?o . } UNION { ?s ?pred ${subjectRef} . } }`;

    await sparqlUpdate(update);
    return res.json({ mensaje: 'Estudiante eliminado correctamente', sujeto: subjectRef });
  } catch (error) {
    console.error('Error deleteStudent:', error);
    return res.status(500).json({ error: 'Error al eliminar estudiante' });
  }
};

export const createStudent = async (req, res) => {
  try {
    const { nombre, carrera, competencias, cedula, telefono, ubicacion } = req.body;

    if (!nombre || !cedula) {
      return res.status(400).json({ error: "Falta nombre o cédula del estudiante" });
    }

    // If cedula provided, check uniqueness: no sujeto debe tener practicas:cedula igual
    const safeCedula = String(cedula).trim().replace(/"/g, '\\"');
    const checkQuery = `${PREFIXES}\nSELECT ?s WHERE { ?s practicas:cedula "${safeCedula}" . } LIMIT 1`;
    const exists = await sparqlQuery(checkQuery);
    const bindings = exists && exists.results && exists.results.bindings ? exists.results.bindings : [];
    if (bindings.length > 0) {
      const existingUri = bindings[0].s && bindings[0].s.value ? bindings[0].s.value : null;
      return res.status(409).json({ error: 'Ya existe un estudiante con esa cédula', existente: existingUri });
    }

    // Build INSERT DATA triples (use practicas: prefix and Spanish property names)
    // Use cedula as subject when present. Also store la cédula literal if provided.
    let triples = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nINSERT DATA {\n  practicas:${safeCedula} a practicas:Estudiante ;\n    practicas:nombre "${String(nombre).replace(/"/g, '\\"')}" .\n`;

    if (cedula) {
      const safeCedula = String(cedula).trim().replace(/"/g, '\\"');
      // If cedula is used as subject, this literal is redundant but kept for querying by literal
      triples += `  practicas:${safeCedula} practicas:cedula "${safeCedula}" .\n`;
    }

    if (carrera) {
      const safeCarrera = String(carrera).trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
      triples += `  practicas:${safeCedula} practicas:perteneceACarrera practicas:${safeCarrera} .\n`;
    }

    if (typeof telefono !== 'undefined' && telefono) {
      const safeTelefono = String(telefono).trim().replace(/"/g, '\\"');
      triples += `  practicas:${safeCedula} practicas:telefono "${safeTelefono}" .\n`;
    }

    if (typeof ubicacion !== 'undefined' && ubicacion) {
      const safeUbicacion = String(ubicacion).trim().replace(/"/g, '\\"');
      triples += `  practicas:${safeCedula} practicas:ubicacion "${safeUbicacion}" .\n`;
    }

    if (Array.isArray(competencias)) {
      for (const comp of competencias) {
        if (!comp) continue;
        const safeComp = String(comp).trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
        triples += `  practicas:${safeCedula} practicas:poseeCompetencia practicas:${safeComp} .\n`;
      }
    }

    triples += `}`;

    await sparqlUpdate(triples);

    // Emitir evento informativo por cada competencia creada (no es una "preferencia")
    try {
      const userId = safeCedula;
      if (Array.isArray(competencias)) {
        for (const comp of competencias) {
          if (!comp) continue;
          const safeComp = String(comp).trim().replace(/[^a-zA-Z0-9_\\-]/g, '_');
          try {
            perfilAgent.emit('competencia_agregada', { userId, competencia: safeComp });
          } catch (e) {
            console.error('Error emitiendo competencia_agregada desde estudiantesController (create):', e);
          }
        }
      }
      try { perfilAgent.emit('usuario_actualizado', { userId }); } catch (e) { console.error('Error emitiendo usuario_actualizado desde estudiantesController (create):', e); }
    } catch (emitErr) {
      console.error('Error preparando emisión de eventos de competencias (create):', emitErr);
    }

    // return the created resource URI in Spanish
    const uri = `http://www.unijob.edu/practicas#${safeCedula}`;
    return res.json({ mensaje: "Estudiante creado correctamente", cedula: safeCedula, uri });
  } catch (error) {
    console.error("Error createStudent:", error);
    return res.status(500).json({ error: "Error al crear estudiante" });
  }
};
