// DEPRECATED: ontologyRoutes consolidado en routers por entidad.
// Usar las siguientes rutas en español:
// - /api/estudiantes (studentsRoutes.js)
// - /api/carreras (careersRoutes.js)
// - /api/ofertas (opportunitiesRoutes.js)
// - /api/competencias (skillsRoutes.js)
// - /api/recomendaciones/:id (recommendationsRoutes.js)

import { Router } from 'express';
const router = Router();

// Keep a no-op router to avoid breaking imports from other places during transition.
export default router;
