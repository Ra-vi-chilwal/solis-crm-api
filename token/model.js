const mongoose = require("mongoose")
const tokenSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    token: { type: mongoose.Schema.Types.String },
    isBlackListed: { type: mongoose.Schema.Types.Boolean },
    company: { type: mongoose.Schema.Types.ObjectId },
  },
  { collection: "token", timestamps: true }
)
const Token = mongoose.model("Token", tokenSchema)
module.exports = { Token, tokenSchema }
