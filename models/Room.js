import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  type: {
    type: String,
    enum: ["individual", "doble", "suite"],
    required: true,
  },
  isAvailable: { type: Boolean, default: true },
});

export default mongoose.model("Room", roomSchema);
