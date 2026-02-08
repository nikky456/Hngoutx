import { Request, Response } from "express";
import Room from "../models/room.model";
import User from "../models/user.model";

// Helper to generate random 6-char code
const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, mode } = req.body;
        const userId = (req as any).user.id; // From authMiddleware

        if (!name || !mode) {
            res.status(400).json({ message: "Room name and mode are required" });
            return;
        }

        let code = generateRoomCode();
        // Ensure uniqueness (simple retry logic)
        let roomExists = await Room.findOne({ code });
        while (roomExists) {
            code = generateRoomCode();
            roomExists = await Room.findOne({ code });
        }

        const room = await Room.create({
            code,
            name,
            hostId: userId,
            mode,
            participants: [userId]
        });

        res.status(201).json(room);
    } catch (error) {
        console.error("Create room error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const joinRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code } = req.body;
        const userId = (req as any).user.id;

        if (!code) {
            res.status(400).json({ message: "Room code is required" });
            return;
        }

        const room = await Room.findOne({ code });

        if (!room) {
            res.status(404).json({ message: "Room not found" });
            return;
        }

        // Add user to participants if not already there
        if (!room.participants.includes(userId)) {
            room.participants.push(userId);
            await room.save();
        }


        res.status(200).json(room);
    } catch (error) {
        console.error("Join room error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getRoomDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const { roomId } = req.params;
        const userId = (req as any).user.id;

        if (!roomId) {
            res.status(400).json({ message: "Room ID is required" });
            return;
        }

        const room = await Room.findById(roomId).populate('participants', 'username email');

        if (!room) {
            res.status(404).json({ message: "Room not found" });
            return;
        }

        // Verify user is a participant
        const isParticipant = room.participants.some((p: any) => p._id.toString() === userId);
        if (!isParticipant) {
            res.status(403).json({ message: "You are not a participant of this room" });
            return;
        }

        res.status(200).json(room);
    } catch (error) {
        console.error("Get room details error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

