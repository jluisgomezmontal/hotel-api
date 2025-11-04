import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guest",
      index: true,
    },
    roomNumber: { type: Number, required: true },
    guestName: { type: String, required: true },
    guestEmail: { type: String, required: true },
    guestPhone: { type: String, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    numberOfGuests: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    totalPaid: { type: Number, default: 0, min: 0 },
    balanceDue: { type: Number, default: function () {
      return this.totalPrice;
    }, min: 0 },
    notes: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "checked-in",
        "checked-out",
        "cancelled",
        "completed",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("Reservation", reservationSchema);
