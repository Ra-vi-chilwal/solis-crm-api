const mongoose = require("mongoose");
const companySchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    company:{type: String, required: true},
    email: { type: String, required: true },
    plan: {type: mongoose.Schema.Types.ObjectId, ref: "plan", required: true},
    PurchasedOn :{type:String,required: true },
    companyLogo:{type:String,required: true},
    expireOn:{type:String,required:true},
    address:{type:String,required:true},
    GSTIN:{type:String,required:true},

  },
  { collection: "company", timestamps: true }
);
const Company = mongoose.model("Company", companySchema);
module.exports = { Company, companySchema };  