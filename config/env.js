import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = {
  JWT_SECRET: process.env.JWT_SECRET,
  MONGO_URI: process.env.MONGO_URI,
};

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
}

const JWT_SECRET = requiredEnvVars.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "12h";
const MONGO_URI = requiredEnvVars.MONGO_URI;
const PORT = process.env.PORT || 3000;

export { JWT_SECRET, JWT_EXPIRES_IN, MONGO_URI, PORT };
