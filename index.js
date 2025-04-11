require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/Users");


const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey123";

// Middleware
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://psyguage.vercel.app",
        "https://psy-guage-frontend.vercel.app"
    ],
    credentials: true
}));
app.use(express.json());

// ✅ Root Route
app.get("/", (req, res) => {
    res.send("This is PsyGuage Backend API!");
});

// user count
app.get('/user-count', async (req, res) => {
    try {
        const count = await User.countDocuments();
        res.send(`Total users: ${count}`);
    } catch (err) {
        console.error('Error fetching user count:', err);
        res.status(500).send('Server error');
    }
});


// ✅ Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    });

// ✅ User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
});
const Users = mongoose.model("Users", userSchema);

// ✅ Score Schema
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

// ✅ Register
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await Users.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new Users({ name, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("❌ Error in register:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Login (Send Token in Response)
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Users.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });

        res.json({
            message: "Login successful",
            token,
            user: {
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("❌ Error in login:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Verify Token
app.get("/api/auth/verify", (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ user: decoded });
    } catch (err) {
        console.error("❌ Token verification error:", err);
        res.status(401).json({ message: "Invalid token" });
    }
});

// ✅ Logout (No-op for token-based auth)
app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Logged out" });
});

// ✅ Save Score
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

// ✅ Get Scores by Email
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

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
}).on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use. Try a different port.`);
    } else {
        console.error("❌ Server error:", err);
    }
});
