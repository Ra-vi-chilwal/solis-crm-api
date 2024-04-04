const { LeadHistory } = require("../history/model")
const mongoose = require("mongoose")
async function getLeadHistory(req, res) {
  const leadId = req.params.leadId // Assuming you have a parameter for the lead Id
  try {
    // Find lead history records with the specified lead ID
    const leadHistory = await LeadHistory.find(
      {
        leadId: leadId,
        company: req.user.company._id,
      },
      { action: 1, actionBy: 1, fieldsUpdated: 1, _id: 0 }
    ).lean()

    // Modify the leadHistory array to transform the followUpInfo field
    const modifiedLeadHistory = leadHistory.map((record) => {
      // Check if followUpInfo is an array, and if so, join its values with commas
      if (
        Array.isArray(record.fieldsUpdated) &&
        record.fieldsUpdated.length > 0
      ) {
        record.fieldsUpdated = record.fieldsUpdated.join(", ")
      }
      return record
    })
    return res.status(200).json({
      code: "SUCCESS",
      data: modifiedLeadHistory,
    })
  } catch (error) {
    console.error("Error fetching lead history:", error)
    return res.status(500).json({
      code: "ERROR",
      message: "Internal Server Error",
    })
  }
}

module.exports = { getLeadHistory }
