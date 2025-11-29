
const QUERY_URL = process.env.FUSEKI_QUERY_URL || 'http://167.172.194.95:3030/unijob/query';
const UPDATE_URL = process.env.FUSEKI_UPDATE_URL || 'http://167.172.194.95:3030/unijob/update';

//Para consultas
export async function sparqlQuery(query) {
    console.log("Ejecutando SPARQL QUERY:");

    const res = await fetch(QUERY_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/sparql-query",
            "Accept": "application/sparql-results+json, application/json"
        },
        body: query
    });
    console.log("Respuesta recibida de Fuseki ", res );
    if (!res.ok) {
        throw new Error(`Error en SPARQL QUERY: ${res.status} ${res.statusText}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/sparql-results+json') || contentType.includes('application/json')) {
        return res.json();
    }

    return res.text();
}

//Para inserts, updates o delete
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

    return true;
}

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
