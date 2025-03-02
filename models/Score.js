// backend/models/Score.js
const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  score: { type: Number, required: true },
  upgrades: { type: Object, default: {} },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Score", scoreSchema);
