const { Invoice } = require("../invoices/model")
// Function to generate a unique invoice number
async function generateInvoiceNumber(req) {
  const today = new Date()
  const year = today.getFullYear()
  const month = (today.getMonth() + 1).toString().padStart(2, "0") // Ensure 2-digit month
  // Find the latest invoice number in the current month
  const latestInvoice = await Invoice.findOne({
    // invoiceNumber: { $regex: `ST/GGN-${year}-${month}`},
    leadId: req.body.leadId,
    company: req.user.company._id,
  }).sort({ invoiceNumber: -1 })
  // Generate the next invoice number
  if (!latestInvoice) {
    return `ST/GGN/${year}-${month}/001`
  } else {
    const lastInvoiceNumber = latestInvoice.invoiceNumber
    const parts = lastInvoiceNumber.split("/")
    // console.log(parts);
    if (parts.length >= 4) {
      const lastNumber = parseInt(parts[3], 10)
      if (!isNaN(lastNumber)) {
        const nextNumber = (lastNumber + 1).toString().padStart(3, "0") // Ensure 3-digit number
        return `ST/GGN/${year}-${month}/${nextNumber}`
      } else {
        console.error("Failed to parse lastNumber:", parts[3])
      }
    } else {
      console.error(
        "Invalid invoiceNumber format:",
        latestInvoice.invoiceNumber
      )
    }
  }
}

module.exports = {
  generateInvoiceNumber,
}
