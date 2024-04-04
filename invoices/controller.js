const {
  errorResponse,
  createResponse,
  fetchResponse,
} = require("../utils/response")
const { Invoice } = require("./model")
const { generateInvoiceNumber } = require("../utils/invoiceNumber")
const moment = require("moment") // Import Moment.js
const generateInvoice = async (req, res) => {
  try {
    let invoiceData = {}
    let itemObj = {}
    const currentDate = moment()
    // Format the date as "DD-MM-YYYY"
    const formattedDate = currentDate.format("DD-MM-YYYY")
    itemObj["name"] = req.body.name
    itemObj["quantity"] = req.body.quantity
    itemObj["rate"] = req.body.rate
    itemObj["taxableAmount"] = req.body.taxableAmount
    // console.log(await generateInvoiceNumber(req));
    invoiceData["invoiceNumber"] = await generateInvoiceNumber(req)
    invoiceData["invoiceDate"] = formattedDate
    invoiceData["leadId"] = req.body.leadId
    invoiceData["suppliers"] = req.user.company.address
    invoiceData["billTo"] = req.body.billTo
    invoiceData["shipTo"] = req.body.shipTo
    invoiceData["items"] = itemObj
    let taxableAmount = req.body.taxableAmount
    // Calculate tax amounts based on percentages (e.g., igst, cgst, sgst)
    const igstPercent = 18
    const cgstPercent = 9
    const sgstPercent = 9
    const igstAmount = (igstPercent / 100) * taxableAmount
    const cgstAmount = (cgstPercent / 100) * taxableAmount
    const sgstAmount = (sgstPercent / 100) * taxableAmount
    invoiceData["taxTotal"] = igstAmount + cgstAmount + sgstAmount
    invoiceData["igstAmount"] = igstAmount
    invoiceData["cgstAmount"] = cgstAmount
    invoiceData["sgstAmount"] = sgstAmount
    // Calculate grandTotal by adding grandTotal and tax amounts
    let grandTotal = igstAmount + cgstAmount + sgstAmount + req.body.rate
    invoiceData["grandTotal"] = grandTotal
    invoiceData["taxTotal"] = igstAmount + cgstAmount + sgstAmount
    invoiceData["notes"] = req.body.notes
    invoiceData["company"] = req.user.company._id
    // console.log(invoiceData);
    const invoiceGenerated = await Invoice.create(invoiceData)
    // console.log(invoiceGenerated);
    return createResponse(
      res,
      "Invoice generated successfully!",
      invoiceGenerated
    )
  } catch (error) {
    console.log(error.message)
    return errorResponse(
      res,
      "Something went wrong while creating Invoice!",
      ""
    )
  }
}

const getInvoices = async (req, res) => {
  try {
    const invoiceData = await Invoice.find({
      leadId: req.params.id,
      company: req.user.company._id,
    }).lean()
    return fetchResponse(res, "Invoices are fetched!", invoiceData)
  } catch (error) {
    console.log(error)
    return errorResponse(
      res,
      "Something went wrong while fetching the invoices!",
      ""
    )
  }
}
module.exports = {
  generateInvoice,
  getInvoices,
}
