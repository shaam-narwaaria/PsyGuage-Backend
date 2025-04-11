const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");

// POST - Save new feedback
router.post("/", async (req, res) => {
  try {
    const feedback = new Feedback(req.body);
    await feedback.save();
    res.status(201).json({ success: true, message: "Feedback received!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error saving feedback" });
  }
});

// GET - Get all feedbacks
router.get("/", async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving feedback" });
  }
});

module.exports = router;
