import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes.js";
import organizationRoutes from "./routes/organization.routes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Customer Support API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/organization", organizationRoutes);

export default app;
