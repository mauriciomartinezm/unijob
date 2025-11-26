
// URLs de Fuseki (defínelos en tu .env). Se proveen valores por defecto sensatos.
const QUERY_URL = process.env.FUSEKI_QUERY_URL || 'http://localhost:3030/dataset/query';
const UPDATE_URL = process.env.FUSEKI_UPDATE_URL || 'http://localhost:3030/dataset/update';

// --- CONSULTAS (SELECT / CONSTRUCT / ASK) ---
export async function sparqlQuery(query) {
    console.log("Ejecutando SPARQL QUERY:", query);

    const res = await fetch(QUERY_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/sparql-query",
            "Accept": "application/sparql-results+json, application/json"
        },
        body: query
    });

    if (!res.ok) {
        throw new Error(`Error en SPARQL QUERY: ${res.status} ${res.statusText}`);
    }

    // Algunos endpoints devuelven JSON de resultados SPARQL; parsearlo.
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/sparql-results+json') || contentType.includes('application/json')) {
        return res.json();
    }

    // Para CONSTRUCT/TURTLE podría venir texto; devolver como texto en ese caso.
    return res.text();
}

// --- ACTUALIZACIONES (INSERT / DELETE / UPDATE) ---
export async function sparqlUpdate(updateBody) {
    console.log("Ejecutando SPARQL UPDATE:", updateBody);

    const res = await fetch(UPDATE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/sparql-update",
            "Accept": "text/boolean, application/sparql-results+json, application/json, text/plain"
        },
        body: updateBody
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Error en SPARQL UPDATE: ${res.status} ${res.statusText} ${text}`);
    }

    // Algunos endpoints no devuelven JSON; devolver true para mantener compatibilidad.
    return true;
}

// --- FUNCION OPCIONAL: TESTEAR CONEXIÓN (exportada, no ejecutada automáticamente) ---
export async function testConnection() {
    try {
        const testQuery = `ASK WHERE { ?s ?p ?o }`;
        const result = await sparqlQuery(testQuery);
        console.log("✔ Conexión exitosa a Apache Fuseki");
        // result.boolean para ASK si devolvió JSON
        console.log("Respuesta ASK:", result && result.boolean ? result.boolean : result);
        return result;
    } catch (error) {
        console.error("❌ Error al conectar con Fuseki:", error);
        throw error;
    }
}
