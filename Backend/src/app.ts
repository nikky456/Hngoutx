import express from "express";
import cors from "cors";
import helmet from "helmet";

const app = express();

//middlewares

app.use(cors());
app.use(helmet());
app.use(express.json());
import authRoutes from "./routes/auth.routes";
import roomRoutes from "./routes/room.routes";

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        message: "HangoutX is running"
    })
})
export default app;