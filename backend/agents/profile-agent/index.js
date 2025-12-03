import EventEmitter from "events";
import { //updateUserPreference, 
    updateUserPreferences } from "./profile.logic.js";

class PerfilAgent extends EventEmitter {
    constructor() {
        super();
        console.log("👤 PerfilAgent iniciado");
        /*
        // Escuchar eventos del sistema 
        this.on("nueva_interaccion", async (data) => {
            try {
                console.log("📩 Evento recibido: nueva_interaccion", data);

                await updateUserPreference(data);
                console.log("✅ Perfil actualizado");

                // Emitir evento señalando que el usuario fue actualizado (para que otros agentes reaccionen)
                try {
                  if (data && data.userId) this.emit('usuario_actualizado', { userId: data.userId });
                } catch (e) {
                  console.error('Error emitiendo usuario_actualizado desde PerfilAgent:', e);
                }
            } catch (err) {
                console.error("❌ Error en PerfilAgent:", err);
            }
        });
        */
        // Escuchar solicitudes para actualizar preferencias del usuario (ubicacion, modalidad, salario)
        this.on('actualizar_preferencias', async (data) => {
            try {
                console.log('📩 Evento recibido: actualizar_preferencias', data);
                await updateUserPreferences(data);
                console.log('✅ Preferencias de usuario actualizadas');
                try {
                    if (data && data.cedula) this.emit('usuario_actualizado', { userId: data.cedula });
                } catch (e) {
                    console.error('Error emitiendo usuario_actualizado desde PerfilAgent (preferencias):', e);
                }
            } catch (err) {
                console.error('❌ Error actualizando preferencias en PerfilAgent:', err);
            }
        });
    }
}

export const perfilAgent = new PerfilAgent();
