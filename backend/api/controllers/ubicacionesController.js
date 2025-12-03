import { sparqlQuery } from "../../shared/fuseki-client.js";

const PREFIXES = `PREFIX practicas: <http://www.unijob.edu/practicas#>`;

export async function getUbicaciones(req, res) {
    try {
        const q = `${PREFIXES}\nSELECT DISTINCT ?ubicacion WHERE { ?op a practicas:OfertaPractica . ?op practicas:ubicacionOferta ?ubicacion . } ORDER BY ?ubicacion`;
        const r = await sparqlQuery(q);
        const bindings = r && r.results && r.results.bindings ? r.results.bindings : [];
    const values = bindings.map(b => b.ubicacion && b.ubicacion.value ? String(b.ubicacion.value).trim() : null).filter(Boolean);
    // dedupe and filter out 'remoto' (and common variants) because remote is handled by modalidad
    const uniq = Array.from(new Set(values)).filter(v => !/^(remoto|remote|remota)$/i.test(String(v).trim()));
    return res.json(uniq);
    } catch (e) {
        console.error('Error fetching ubicaciones:', e);
        return res.status(500).json({ error: 'Error fetching ubicaciones' });
    }
}
