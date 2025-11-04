import express from "express";
import { getMonthlyReport } from "../controllers/reportController.js";

const router = express.Router();

router.get("/monthly", getMonthlyReport);

export default router;
