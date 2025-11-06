import express from "express";
import {
  createGuest,
  getGuests,
  getGuestById,
  updateGuest,
  deleteGuest,
} from "../controllers/guestController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getGuests);
router.get("/:id", getGuestById);
router.post("/", createGuest);
router.put("/:id", updateGuest);
router.delete("/:id", deleteGuest);

export default router;
