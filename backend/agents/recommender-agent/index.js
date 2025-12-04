import EventEmitter from "events";
import { generarRecomendaciones, generarYpersistirRecomendaciones } from "./recommender.logic.js";
import { perfilAgent } from "../profile-agent/index.js";

class RecommendAgent extends EventEmitter {
    constructor() {
        super();
        console.log("🤖 RecommendAgent iniciado");

        // Escuchar evento de petición de recomendación
        this.on("solicitar_recomendacion", async ({ userId, options, callback }) => {
            try {
                console.log("🔍 Generando recomendaciones para:", userId);

                const recomendaciones = await generarRecomendaciones(userId, options || {});

                // Devolver los resultados a quien llamó el evento
                if (typeof callback === 'function') callback(recomendaciones);

            } catch (err) {
                console.error("❌ Error en RecommendAgent:", err);
            }
        });

        // Escuchar eventos de actualización de perfil para recalcular recomendaciones
        try {
            perfilAgent.on('usuario_actualizado', async ({ userId }) => {
                try {
                    console.log('🔁 Usuario actualizado, recalculando recomendaciones para', userId);
                    await generarYpersistirRecomendaciones(userId);
                    console.log('✅ Recomendaciones recalculadas para', userId);
                } catch (err) {
                    console.error('❌ Error al recalcular recomendaciones para', userId, err);
                }
            });
        } catch (e) {
            console.error('Error registrando listener usuario_actualizado en RecommendAgent:', e);
        }

        // Escuchar solicitudes para recalcular y persistir recomendaciones (desde API/admin)
        /*
        this.on('solicitar_recalculo', async ({ userId, callback }) => {
            try {
                console.log('🔁 Solicitud explícita de recalculo para', userId);
                const rows = await generarYpersistirRecomendaciones(userId);
                if (typeof callback === 'function') callback(null, rows);
            } catch (err) {
                console.error('❌ Error en solicitar_recalculo:', err);
                if (typeof callback === 'function') callback(err);
            }
        });
        */
    }
}

export const recommendAgent = new RecommendAgent();
