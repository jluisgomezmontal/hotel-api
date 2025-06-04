import express from "express";
import {
  createReservation,
  getAllRooms,
  getAvailableRooms,
  updateReservationStatus,
} from "../controllers/reservationsController.js";

const router = express.Router();

router.post("/", createReservation);
router.patch("/reservations/:id/status", updateReservationStatus);
router.get("/rooms/available", getAvailableRooms);
router.get("/rooms/all", getAllRooms);

export default router;
