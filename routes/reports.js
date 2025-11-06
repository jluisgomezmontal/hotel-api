import express from "express";
import { getMonthlyReport } from "../controllers/reportController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/monthly", getMonthlyReport);

export default router;
