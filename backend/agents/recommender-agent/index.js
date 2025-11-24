import EventEmitter from "events";
import { generarRecomendaciones } from "./recommender.logic.js";

class RecommendAgent extends EventEmitter {
    constructor() {
        super();
        console.log("🤖 RecommendAgent iniciado");

        // Escuchar evento de petición de recomendación
        this.on("solicitar_recomendacion", async ({ userId, callback }) => {
            try {
                console.log("🔍 Generando recomendaciones para:", userId);

                const recomendaciones = await generarRecomendaciones(userId);

                // Devolver los resultados a quien llamó el evento
                callback(recomendaciones);

            } catch (err) {
                console.error("❌ Error en RecommendAgent:", err);
            }
        });
    }
}

export const recommendAgent = new RecommendAgent();
