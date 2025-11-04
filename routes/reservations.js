import express from "express";
import {
  createReservation,
  getReservations,
  getReservationById,
  getAvailableRooms,
  getRoomsOverview,
  getReservationsByRoom,
  updateReservation,
  updateReservationStatus,
} from "../controllers/reservationsController.js";

const router = express.Router();

router.get("/", getReservations);
router.get("/rooms/available", getAvailableRooms);
router.get("/rooms/overview", getRoomsOverview);
router.get("/rooms/:roomNumber/reservations", getReservationsByRoom);
router.get("/:id", getReservationById);
router.post("/", createReservation);
router.put("/:id", updateReservation);
router.patch("/:id/status", updateReservationStatus);

export default router;
