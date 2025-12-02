import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import estudiantesRouter from "./api/routes/estudiantesRoutes.js";
import carrerasRouter from "./api/routes/carrerasRoutes.js";
import ofertasRouter from "./api/routes/ofertasRoutes.js";
import competenciasRouter from "./api/routes/competenciasRoutes.js";
import recomendacionesRouter from "./api/routes/recomendacionesRoutes.js";
import profileRouter from "./api/routes/profileRoutes.js";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const PORT = process.env.PORT || 3001;

app.use(estudiantesRouter);
app.use(carrerasRouter);
app.use(ofertasRouter);
app.use(competenciasRouter);
app.use(recomendacionesRouter);
app.use(profileRouter);


app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});