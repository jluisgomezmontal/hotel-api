import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import roomRoutes from "./routes/rooms.js";
import roomReservations from "./routes/reservations.js";

dotenv.config();
const app = express();

// Lista de orígenes permitidos
const allowedOrigins = [
  "http://localhost:5173",
  "https://cheerful-pavlova-cc42bf.netlify.app",
  "https://hoteles-admin-acapulco.netlify.app",
];

// Configuración de CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (como Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  },
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

// Conexión a MongoDB y levantamiento del servidor
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
