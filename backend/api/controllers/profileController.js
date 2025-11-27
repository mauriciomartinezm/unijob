import { sparqlQuery } from "../../shared/fuseki-client.js";
import { perfilAgent } from "../../agents/profile-agent/index.js";


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
