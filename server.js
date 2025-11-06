import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import roomRoutes from "./routes/rooms.js";
import roomReservations from "./routes/reservations.js";
import guestRoutes from "./routes/guests.js";
import paymentRoutes from "./routes/payments.js";
import reportRoutes from "./routes/reports.js";
import authRoutes from "./routes/auth.js";

import { errorHandler } from "./middlewares/errorHandler.js";
import { MONGO_URI, PORT } from "./config/env.js";
const app = express();

// Lista de orígenes permitidos
const allowedOrigins = [
  "http://localhost:5173",
  "https://mi-hotel-acapulco.vercel.app",
  "http://localhost:3001",
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
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/reservations", roomReservations);
app.use("/api/guests", guestRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);

// Manejo centralizado de errores
app.use(errorHandler);

// Conexión a MongoDB y levantamiento del servidor
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB conectado");
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch((err) => console.error("Error de conexión:", err));
