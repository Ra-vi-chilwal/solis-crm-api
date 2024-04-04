const mongoose = require("mongoose")
const trackerSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    leads: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leads",
      required: true,
    },
    action: { type: String, enum: ["accepted", "rejected", "skipped"] },
    description: { type: String, default: "" },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    managerAction: { type: Boolean, default: false },
    managerJustification: { type: String, default: "" },
    isJustified: { type: Boolean, default: true },
    userActionDate: { type: String, default: "" },
    userActionTime: { type: String, default: "" },
    managerActionDate: { type: String, default: "" },
    managerActionTime: { type: String, default: "" },
  },
  { timestamps: false }
)
const Tracker = mongoose.model("Tracker", trackerSchema)
module.exports = { Tracker }
