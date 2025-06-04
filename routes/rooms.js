import express from "express";
import {
  getAllRooms,
  updateRoom,
  createRoom,
} from "../controllers/roomController.js";

const router = express.Router();

router.get("/", getAllRooms);
router.put("/:id", updateRoom);
router.post("/", createRoom);

export default router;
