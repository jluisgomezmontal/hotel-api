import express from "express";
import {
  getAllRooms,
  getRoomById,
  searchRooms,
  updateRoom,
  updateRoomAvailability,
  createRoom,
  deleteRoom,
} from "../controllers/roomController.js";

const router = express.Router();

router.get("/", getAllRooms);
router.get("/search", searchRooms);
router.get("/:id", getRoomById);
router.put("/:id", updateRoom);
router.patch("/:id/availability", updateRoomAvailability);
router.post("/", createRoom);
router.delete("/:id", deleteRoom);

export default router;
