import express from "express";
import {
  getAllRooms,
  updateRoom,
  createRoom,
  deleteRoom,
} from "../controllers/roomController.js";

const router = express.Router();

router.get("/", getAllRooms);
router.put("/:id", updateRoom);
router.post("/", createRoom);
router.delete("/:id", deleteRoom);

export default router;
