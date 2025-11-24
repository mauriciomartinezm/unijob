import EventEmitter from "events";
import { updateUserPreference } from "./perfil.logic.js";

class PerfilAgent extends EventEmitter {
    constructor() {
        super();
        console.log("👤 PerfilAgent iniciado");

        // Escuchar eventos del sistema
        this.on("nueva_interaccion", async (data) => {
            try {
                console.log("📩 Evento recibido: nueva_interaccion", data);

                await updateUserPreference(data);
                
                console.log("✅ Perfil actualizado");
            } catch (err) {
                console.error("❌ Error en PerfilAgent:", err);
            }
        });
    }
}

// Exportar instancia lista para usar
export const perfilAgent = new PerfilAgent();
