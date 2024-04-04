const mongoose = require("mongoose")
const notesSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "leads", required: true },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  notes: { type: String },
  date: { type: String },
  time: { type: String },
  updateTime: { type: String },
  updateDate: { type: String },
})
const Notes = mongoose.model("Notes", notesSchema)
module.exports = { Notes }
