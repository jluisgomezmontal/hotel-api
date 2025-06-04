import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  roomNumber: { type: Number, required: true },
  guestName: { type: String, required: true },
  guestEmail: { type: String, required: true },
  guestPhone: { type: String, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed"], // Más estados
    default: "pending",
  },
});
export default mongoose.model("Reservation", reservationSchema);
