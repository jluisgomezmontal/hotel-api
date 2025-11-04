import mongoose from "mongoose";

const guestSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ["ine", "pasaporte", "licencia", "otro"],
      default: "otro",
      index: true,
    },
    documentNumber: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

guestSchema.index({ lastName: 1, firstName: 1 });

guestSchema.path("email").validate((value) => {
  // Validación básica de email
  const emailRegex = /^(?:[a-zA-Z0-9_'^&/+-])+(?:\.(?:[a-zA-Z0-9_'^&/+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/i;
  return emailRegex.test(value);
}, "Correo electrónico inválido");

export default mongoose.model("Guest", guestSchema);
