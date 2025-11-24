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
