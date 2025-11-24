import { sparqlUpdate } from "../../shared/fuseki-client.js";

/*
data = {
    userId: "estudiante123",
    competencia: "ProgramacionWeb",
    gusto: true   // true = le gusta / false = no le interesa
}
*/

export async function updateUserPreference(data) {
    const { userId, competencia, gusto } = data;
        // Use the project's practicas ontology namespace
        const update = `
            PREFIX practicas: <http://www.ejemplo.org/practicas#>

            INSERT DATA {
                practicas:${userId} practicas:tienePreferencia practicas:${competencia} .
                practicas:${userId} practicas:valorPreferencia "${gusto ? "like" : "dislike"}" .
            }
        `;

        await sparqlUpdate(update);
}
