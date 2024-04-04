const mongoose = require("mongoose");
const roleSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    title: { type: String, required: true },
    slug: { type: String,required: true  },
    permission :{type:Array,required: true },
  },
  { collection: "role", timestamps: true }
);
const Role = mongoose.model("Role", roleSchema);
module.exports = { Role, roleSchema };
