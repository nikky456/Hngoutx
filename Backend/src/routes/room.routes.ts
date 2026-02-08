import { Router } from "express";
import { createRoom, joinRoom, getRoomDetails } from "../controllers/room.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/create", protect, createRoom);
router.post("/join", protect, joinRoom);
router.get("/:roomId", protect, getRoomDetails);

export default router;
