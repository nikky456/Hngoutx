import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.model";
import { env } from "../config/env";

const client = new OAuth2Client(); // We don't necessarily need Client ID here for simple verification if using verifyIdToken correctly with audience check inside

const generateToken = (id: string) => {
    return jwt.sign({ id }, env.JWT_SECRET, {
        expiresIn: "30d",
    });
};

export const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            res.status(400).json({ message: "All fields are required" });
            return;
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: "User already exists" });
            return;
        }

        const user = await User.create({
            username,
            email,
            password,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id.toString()),
            });
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: "All fields are required" });
            return;
        }


        const user = await User.findOne({ email });

        // Check if user exists and has a password (if created via Google they might not have one)
        if (user && user.password && (await (user as any).comparePassword(password))) {
            res.status(200).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id.toString()),
            });
        } else {
            // Differentiation for better UX could be added here (e.g. "Use Google Sign In")
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { credential } = req.body; // Here 'credential' is actually the access_token from frontend

        // Verify Access Token by calling Google UserInfo Endpoint
        const googleResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
            headers: {
                Authorization: `Bearer ${credential}`
            }
        });

        if (!googleResponse.ok) {
            res.status(400).json({ message: "Invalid Google Token" });
            return;
        }

        const payload = await googleResponse.json();

        const { email, name, sub: googleId, picture } = payload;

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            // User exists, check if googleId is linked
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // Create new user
            user = await User.create({
                username: name || email.split('@')[0],
                email,
                googleId,
                avatar: picture,
                // No password for google users
            });
        }

        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            token: generateToken(user._id.toString()),
        });

    } catch (error: any) {
        console.error("Google login error:", error);
        res.status(500).json({ message: "Google authentication failed" });
    }
};
