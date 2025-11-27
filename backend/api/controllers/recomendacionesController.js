import { sparqlQuery } from "../../shared/fuseki-client.js";
import { generarYpersistirRecomendaciones } from "../../agents/recommender-agent/recommender.logic.js";
import { recommendAgent } from "../../agents/recommender-agent/index.js";

const PREFIXES = `PREFIX practicas: <http://www.unijob.edu/practicas#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>`;

function parseBindings(bindings) {
  return bindings.map(b => {
    const obj = {};
    for (const k of Object.keys(b)) obj[k] = b[k].value;
    return obj;
  });
}

// Admin endpoint: recompute and persist recommendations for a user
export const refreshRecommendations = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = id;
    // Ask the RecommendAgent to recalculate and persist recommendations
    const rows = await new Promise((resolve, reject) => {
      // timeout in case agent fails to respond
      let called = false;
      const timer = setTimeout(() => {
        if (!called) {
          called = true;
          return reject(new Error('Timeout al solicitar recalculo al agente'));
        }
      }, 15000);

      recommendAgent.emit('solicitar_recalculo', { userId, callback: (err, result) => {
        if (called) return;
        called = true;
        clearTimeout(timer);
        if (err) return reject(err);
        return resolve(result || []);
      }});
    });

    return res.json({ message: 'Recomendaciones recalculadas (via agent)', count: Array.isArray(rows) ? rows.length : 0 });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al recalcular recomendaciones' });
  }
};

// Endpoint to request live recommendations from the RecommendAgent (does not persist)
export const solicitarRecomendacion = async (req, res) => {
    console.log("solicitarRecomendacion called");
  try {
    const id = req.params.id;
    const userId = id;

    const rows = await new Promise((resolve, reject) => {
      let called = false;
      const timer = setTimeout(() => {
        if (!called) {
          called = true;
          return reject(new Error('Timeout al solicitar recomendaciones al agente'));
        }
      }, 10000);

      recommendAgent.emit('solicitar_recomendacion', { userId, callback: (result) => {
        if (called) return;
        called = true;
        clearTimeout(timer);
        return resolve(result || []);
      }});
    });

    return res.json({ user: id, recommendations: rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al solicitar recomendaciones en vivo' });
  }
};
