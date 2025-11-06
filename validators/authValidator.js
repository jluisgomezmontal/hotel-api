import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo electrónico inválido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña no puede exceder 100 caracteres"),
});

export const registerSchema = z.object({
  body: credentialsSchema.extend({
    firstName: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(50, "El nombre no puede exceder 50 caracteres"),
    lastName: z
      .string()
      .trim()
      .min(2, "El apellido debe tener al menos 2 caracteres")
      .max(50, "El apellido no puede exceder 50 caracteres"),
  }),
});

export const loginSchema = z.object({
  body: credentialsSchema,
});
