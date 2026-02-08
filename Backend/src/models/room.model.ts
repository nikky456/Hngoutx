import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        minlength: 6,
        maxlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    mode: {
        type: String, // MOVIE, MUSIC, etc.
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // Optional: Rooms expire after 24 hours to clean up
    }
});

const Room = mongoose.model("Room", roomSchema);

export default Room;
