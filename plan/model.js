const mongoose = require("mongoose")
const planSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    planName: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true },
    storage: { type: Number, required: true },
    users: { type: Number, required: true },
  },
  { collection: "plan", timestamps: true }
)
const Plan = mongoose.model("plan", planSchema)
module.exports = { Plan, planSchema }
