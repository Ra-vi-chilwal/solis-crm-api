const mongoose = require("mongoose")
const invoiceSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: String, required: true }, // Date of the invoice
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Leads" }, // Lead Information
  suppliers: { name: String, address: String }, // Suppliers or Senders address
  billTo: { name: String, address: String }, // Billing address
  shipTo: { name: String, address: String }, // Recipient's address
  items: {
    sNo: { type: Number, default: 1 },
    name: String,
    // hsnCode: Number,
    quantity: Number,
    rate: Number,
    taxableAmount: Number,
  }, // object of item/service in the invoice
  // subTotal: { type: Number },
  taxTotal: { type: Number },
  igstPercent: { type: Number, default: 18 },
  cgstPercent: { type: Number, default: 9 },
  sgstPercent: { type: Number, default: 9 },
  igstAmount: { type: Number },
  cgstAmount: { type: Number },
  sgstAmount: { type: Number },
  grandTotal: { type: Number },
  notes: { type: String },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
})
const Invoice = mongoose.model("Invoice", invoiceSchema)
module.exports = { Invoice } // Export the model for use in other parts of your application
