import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import studentsRouter from "./api/routes/studentsRoutes.js";
import careersRouter from "./api/routes/careersRoutes.js";
import opportunitiesRouter from "./api/routes/opportunitiesRoutes.js";
import skillsRouter from "./api/routes/skillsRoutes.js";
import recommendationsRouter from "./api/routes/recommendationsRoutes.js";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const PORT = process.env.PORT || 3001;

// Configuración de CORS

// Configuración del body parser para manejar las solicitudes JSON
app.use(studentsRouter);
app.use(careersRouter);
app.use(opportunitiesRouter);
app.use(skillsRouter);
app.use(recommendationsRouter);


// Inicia el servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});