import express from "express";
import {
  registerPayment,
  getPayments,
  getPaymentById,
  getPaymentsByReservation,
} from "../controllers/paymentController.js";

const router = express.Router();

router.get("/", getPayments);
router.get("/reservation/:reservationId", getPaymentsByReservation);
router.get("/:id", getPaymentById);
router.post("/", registerPayment);

export default router;
