
// URLs de Fuseki (defínelos en tu .env)
const QUERY_URL = process.env.FUSEKI_QUERY_URL;
const UPDATE_URL = process.env.FUSEKI_UPDATE_URL;
// --- CONSULTAS (SELECT / CONSTRUCT) ---
export async function sparqlQuery(query) {
    console.log("Ejecutando SPARQL QUERY:", query);
    const res = await fetch(QUERY_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/sparql-query"
        },
        body: query
    });

    if (!res.ok) {
        throw new Error(`Error en SPARQL QUERY: ${res.status} ${res.statusText}`);
    }

    return res.json();
}

// --- ACTUALIZACIONES (INSERT / DELETE) ---
export async function sparqlUpdate(update) {
    const res = await fetch(UPDATE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/sparql-update"
        },
        body: update
    });

    if (!res.ok) {
        throw new Error(`Error en SPARQL UPDATE: ${res.status} ${res.statusText}`);
    }

    return true;
}

// --- TESTEAR CONEXIÓN ---
async function testConnection() {
    try {
        const testQuery = `
            ASK WHERE { ?s ?p ?o }
        `;

        const result = await sparqlQuery(testQuery);

        console.log("✔ Conexión exitosa a Apache Fuseki");
        console.log("Respuesta ASK:", result.boolean);
    } catch (error) {
        console.error("❌ Error al conectar con Fuseki:", error);
    }
}

testConnection();
