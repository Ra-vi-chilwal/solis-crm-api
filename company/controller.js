const { notFoundResponse } = require("../utils/response")
const { errorResponse } = require("../utils/services")
const { Company } = require("./model")

module.exports = {
  addCompany: async (req, res) => {
    const userData = req.body
    try {
      const existingUser = await Company.findOne({ email: userData.email })
      if (existingUser) {
        return res.status(200).json({
          code: "DUPLICATION",
          message: "Company  already exists.",
        })
      }
      const result = await Company.create({
        ...userData,
        companyLogo: req.file.filename,
      })
      res.status(200).json({
        code: "SUCCESS",
        data: result,
      })
    } catch (error) {
      console.error("Error adding Company:", error)
      res.status(500).json({
        code: "ERROR",
        message: "An error occurred while adding the Company.",
      })
    }
  },

  //--------------------GET DEPARTMENT----------------------------------
  getCompany: async (req, res) => {
    try {
     
      const companyDetails = await Company.find()
      if (!companyDetails) return notFoundResponse(res, "No company found!", "")
      return res.status(200).json({
        code: "FETCHED",
        data: companyDetails,
      })
    } catch (err) {
      console.log("err")
      return errorResponse(
        res,
        "Something went wrong while fetching companies!",
        ""
      )
    }
  },
}
