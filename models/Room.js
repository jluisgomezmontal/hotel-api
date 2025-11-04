import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true },
    type: {
      type: String,
      enum: ["individual", "doble", "suite"],
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    amenities: {
      type: [String],
      default: [],
    },
    isAvailable: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Room", roomSchema);
