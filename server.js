import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import roomRoutes from "./routes/rooms.js";
import roomReservations from "./routes/reservations.js";

dotenv.config();
const app = express();

// Configuración de CORS
const corsOptions = {
  origin: "http://localhost:5173",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());

// Rutas
app.use("/api/rooms", roomRoutes);
app.use("/api/reservations", roomReservations);

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB conectado");
    app.listen(process.env.PORT || 3000, () => {
      console.log(
        `Servidor corriendo en el puerto ${process.env.PORT || 3000}`
      );
    });
  })
  .catch((err) => console.error("Error de conexión:", err));
