require("dotenv").config(); // Load environment variables from .env
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000; // Default to 3000 if PORT is missing
const MONGO_URI = process.env.MONGO_URI; // Use .env variable

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Root Route to Prevent "Cannot GET /"
app.get("/", (req, res) => {
    res.send("Welcome to PsyGuage Backend API!");
});

// ✅ Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1); // Exit process on failure
    });

// ✅ Define User Schema and Model
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true }, // Ensures unique emails
});
const Users = mongoose.model("Users", userSchema);

// ✅ Define Score Schema and Model
const scoreSchema = new mongoose.Schema({
    gameName: String,
    name: String,
    email: String,
    score: Number,
    responseSymbolTime: Number,
    correctSymbolCount: Boolean,
    createdAt: { type: Date, default: Date.now },
});
const Score = mongoose.model("Score", scoreSchema);

// ✅ Register a new user
app.post("/api/register", async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: "Name and Email are required" });
        }

        const existingUser = await Users.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        const newUser = new Users({ name, email });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        console.error("❌ Error registering user:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Save game scores
app.post("/api/scores", async (req, res) => {
    try {
        const { gameName, name, email, score, responseSymbolTime, correctSymbolCount } = req.body;

        if (!gameName || !name || !email || score == null) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const newScore = new Score({ gameName, name, email, score, responseSymbolTime, correctSymbolCount });
        await newScore.save();
        res.status(201).json(newScore);
    } catch (error) {
        console.error("❌ Error saving score:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Retrieve scores by email
app.get("/api/getscores", async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const scores = await Score.find({ email }).sort({ score: -1 });
        if (scores.length === 0) {
            return res.status(404).json({ message: "No scores found for this user" });
        }

        res.json(scores);
    } catch (error) {
        console.error("❌ Error fetching scores:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Start Server with Error Handling
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
}).on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use. Try a different port.`);
    } else {
        console.error("❌ Server error:", err);
    }
});
