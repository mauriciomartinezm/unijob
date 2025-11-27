import { sparqlQuery, sparqlUpdate } from "../../shared/fuseki-client.js";
import { perfilAgent } from "../../agents/profile-agent/index.js";
import crypto from 'crypto';


export const createInteraction = async (req, res) => {
    try {
        const data = req.body;

        // Emitir evento al agente de perfil
        perfilAgent.emit("nueva_interaccion", data);

        res.json({ message: "Interacción procesada correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al registrar interacción" });
    }
};

export const setPreferences = async (req, res) => {
    try {
        const data = req.body; // { userId, ubicacion, modalidad, salario }
        if (!data || !data.cedula) return res.status(400).json({ error: 'Falta cedula' });
        if (!('ubicacion' in data) && !('modalidad' in data) && !('salario' in data)) {
            return res.status(400).json({ error: 'Debe indicar al menos una preferencia: ubicacion, modalidad o salario' });
        }

        // Emitir evento al agente de perfil para que persista las preferencias
        perfilAgent.emit('actualizar_preferencias', data);

        return res.json({ message: 'Preferencias enviadas para procesamiento' });
    } catch (error) {
        console.error('Error setPreferences:', error);
        return res.status(500).json({ error: 'Error al actualizar preferencias' });
    }
};

// Register / set password for a user identified by cedula
export const register = async (req, res) => {
    try {
        const { cedula, contrasena, nombre } = req.body;
        if (!cedula || !contrasena) return res.status(400).json({ error: 'cedula y contrasena requeridos' });

        const safeCedula = String(cedula).trim().replace(/"/g, '\\"');

        // find subject with that cedula
        const q = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nSELECT ?s WHERE { ?s practicas:cedula "${safeCedula}" . } LIMIT 1`;
        const r = await sparqlQuery(q);
        const bindings = r && r.results && r.results.bindings ? r.results.bindings : [];
        let subjectRef;
        if (bindings.length > 0) {
            subjectRef = bindings[0].s.value; // full URI
        } else {
            // create a new subject using cedula as fragment
            const frag = safeCedula.replace(/[^a-zA-Z0-9_\-]/g, '_');
            subjectRef = `http://www.unijob.edu/practicas#${frag}`;
            // insert minimal student triple (and nombre if provided)
            let insert = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nINSERT DATA { practicas:${frag} a practicas:Estudiante ; practicas:cedula "${safeCedula}" . `;
            if (nombre) insert += ` practicas:${frag} practicas:nombre "${String(nombre).replace(/"/g, '\\"')}" . `;
            insert += ` }`;
            await sparqlUpdate(insert);
        }

    // Hash password (contrasena) with scrypt + random salt
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(String(contrasena), salt, 64).toString('hex');
        const stored = `${salt}$${derived}`;

        // store as practicas:contrasenaHash literal (replace existing)
        const subjRef = subjectRef.startsWith('http') ? `<${subjectRef}>` : `practicas:${subjectRef}`;
        const update = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nDELETE { ${subjRef} practicas:contrasenaHash ?old . }\nINSERT { ${subjRef} practicas:contrasenaHash "${stored}" . }\nWHERE { OPTIONAL { ${subjRef} practicas:contrasenaHash ?old . } }`;
        await sparqlUpdate(update);

        return res.json({ message: 'Usuario registrado / contrasena guardada', user: subjectRef });
    } catch (err) {
        console.error('Error register:', err);
        return res.status(500).json({ error: 'Error al registrar usuario' });
    }
};

// Login: check cedula + contrasena
export const login = async (req, res) => {
    try {
        const { cedula, contrasena } = req.body;
        if (!cedula || !contrasena) return res.status(400).json({ error: 'cedula y contrasena requeridos' });
        const safeCedula = String(cedula).trim().replace(/"/g, '\\"');

        // Query for subject and stored hash
        const q = `PREFIX practicas: <http://www.unijob.edu/practicas#>\nSELECT ?s ?hash WHERE { ?s practicas:cedula "${safeCedula}" . OPTIONAL { ?s practicas:contrasenaHash ?hash } } LIMIT 1`;
        const r = await sparqlQuery(q);
        const bindings = r && r.results && r.results.bindings ? r.results.bindings : [];
        if (bindings.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });
        const row = bindings[0];
        const stored = row.hash && row.hash.value ? row.hash.value : null;
        if (!stored) return res.status(401).json({ error: 'Usuario sin contraseña' });

    const [salt, hash] = stored.split('$');
        if (!salt || !hash) return res.status(500).json({ error: 'Formato de contraseña inválido' });

    const derived = crypto.scryptSync(String(contrasena), salt, 64).toString('hex');
        const match = crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
        if (!match) return res.status(401).json({ error: 'Credenciales inválidas' });

        // success - return basic user info (subject uri)
        const subject = row.s && row.s.value ? row.s.value : null;
        return res.json({ message: 'Login exitoso', user: subject });
    } catch (err) {
        console.error('Error login:', err);
        return res.status(500).json({ error: 'Error en login' });
    }
};
