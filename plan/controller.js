const { Users } = require("../Auth/model")
const { Company } = require("../company/model")
const { LeadHistory } = require("../history/model")
const { fetchLeadsForCampaign } = require("../leadSource/controller")
const { Leads } = require("../leadSource/model")
const { fetchResponse, errorResponse } = require("../utils/services")
const { Plan } = require("./model")

module.exports = {
  addPlan: async (req, res) => {
    try {
      const userData = req.body
      const existingUser = await Plan.findOne({ planName: userData.planName })
      if (existingUser) {
        return res.status(200).json({
          code: "DUPLICATION",
          message: "Plan  already exists.",
        })
      }
      const result = await Plan.create(userData)
      res.status(200).json({
        code: "SUCCESS",
        data: result,
      })
    } catch (error) {
      console.error("Error adding plan:", error)
      res.status(500).json({
        code: "ERROR",
        message: "An error occurred while adding the plan.",
      })
    }
  },

  //--------------------GET DEPARTMENT----------------------------------
  getPlan: async (req, res) => {
    try {
      await Plan.find({}).then((result, err) => {
        if (result) {
          return res.status(200).json({
            code: "FETCHED",
            data: result,
          })
        } else {
          return res.status(400).json({
            code: "ERROR",
            data: err,
          })
        }
      })
    } catch (err) {
      console.log("err")
    }
  },

  storage: async (req, res) => {
    try {
      // Define the company name you want to filter by
      const companyName = req.user.company._id

      // Define a common aggregation pipeline
      const pipeline = [
        {
          $match: {
            company: companyName,
          },
        },
        {
          $project: {
            size: { $bsonSize: "$$ROOT" },
          },
        },
        {
          $group: {
            _id: null,
            totalSize: { $sum: "$size" },
          },
        },
      ]

      // Create an array of promises for aggregation queries on each collection
      const aggregationPromises = [
        Leads.aggregate(pipeline),
        Users.aggregate(pipeline),
        Company.aggregate(pipeline),
        LeadHistory.aggregate(pipeline),
      ]

      // Execute all aggregation queries in parallel
      const results = await Promise.all(aggregationPromises)

      // Calculate the total size in bytes
      const totalSizeInBytes = results.reduce((total, result) => {
        if (result.length > 0 && result[0].totalSize) {
          return total + result[0].totalSize
        }
        return total
      }, 0)

      // Fetch the storage details from the plan
      const planDetails = await Plan.findOne({
        _id: req.user.company.plan._id,
      })

      // Calculate Used Storage in GB
      const usedStorageInGB = totalSizeInBytes / (1024 * 1024 * 1024)

      // Calculate Used Storage Percentage
      const usedStoragePercentage =
        (usedStorageInGB / planDetails.storage) * 100

      // Calculate Left Storage Percentage
      const leftStoragePercentage = 100 - usedStoragePercentage
      // Send the response
      return fetchResponse(res, "Data fetched successfully!", {
        "Total Storage": `${planDetails.storage} GB`,
        "Used Storage": `${usedStorageInGB.toFixed(4)} GB`,
        "Used Storage in %": `${usedStoragePercentage.toFixed(4)}%`,
        "Left Storage in %": `${leftStoragePercentage.toFixed(4)}%`,
      })
    } catch (error) {
      console.error("Error calculating storage:", error)
      res.status(500).json({ error: "Error calculating storage" })
    }
  },
  getUsersPlan: async (req, res) => {
    try {
      const associatedUsers = await Users.find({
        company: req.user.company._id,
      }).countDocuments()
      const planDetails = await Plan.findOne({
        _id: req.user.company.plan._id,
      })

      // Calculate the percentages
      const totalPercentage = 100
      const associatedPercentage = (associatedUsers / planDetails.users) * 100
      const vacantPercentage = totalPercentage - associatedPercentage
      const occupiedPercentage = associatedPercentage

      let responseObj = {
        total: planDetails.users,
        totalPercentage: `${totalPercentage}%`,
        associatedUsers,
        vacant: planDetails.users - associatedUsers,
        vacantPercentage: `${vacantPercentage.toFixed(2)}%`,
        occupiedPercentage: `${occupiedPercentage.toFixed(2)}%`,
      }

      return fetchResponse(res, "Data fetched successfully!", responseObj)
    } catch (error) {
      console.log(error)
      return errorResponse(res, "Something went wrong!", "")
    }
  },
}
