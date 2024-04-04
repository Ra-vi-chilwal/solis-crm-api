const mongoose = require("mongoose")
const leadHistorySchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "leads",
      required: true,
    },
    action: { type: String },
    fieldsUpdated: { type: Array },
    actionBy: { type: String, required: true },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    date: { type: String, default: "" },
    time: { type: String, default: "" },
  },
  { collection: "leadHistory", timestamps: false }
)
const LeadHistory = mongoose.model("LeadHistory", leadHistorySchema)
module.exports = { LeadHistory, leadHistorySchema }
