// DEPRECATED: ontologyRoutes consolidated into entity-specific routers.
// Use the following routes instead:
// - /api/students (studentsRoutes.js)
// - /api/careers (careersRoutes.js)
// - /api/opportunities (opportunitiesRoutes.js)
// - /api/skills (skillsRoutes.js)
// - /api/recommendBySkills/:id (recommendationsRoutes.js)

import { Router } from 'express';
const router = Router();

// Keep a no-op router to avoid breaking imports from other places during transition.
export default router;
