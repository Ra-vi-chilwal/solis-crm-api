const { Leads } = require("./model")
const { LeadHistory } = require("../history/model")
const moment = require("moment")
const fs = require("fs").promises
const dotenv = require("dotenv")
const path = require("path")
const { ObjectId } = require("mongodb")
const {
  errorResponse,
  fetchResponse,
  unauthorizedResponse,
  notFoundResponse,
} = require("../utils/response")
const { saveLeadsFromResponse } = require("../utils/services")
const axios = require("axios")
const { log } = require("console")
const { Tracker } = require("../userTracker/model")
require("dotenv").config()
module.exports = {
  getManualLeads: async (req, res) => {
    try {
      const permissionLength = req.user.role.permission.length
      let leadsData
      if (permissionLength == 5 || permissionLength == 4) {
        leadsData = await Leads.find({
          leadSource: { $ne: "facebook" },
          company: req.user.company._id,
        })
          .populate("leadCreatedBy", "firstName lastName")
          .populate("users.id", "firstName lastName")
          .sort({ createdAt: -1 })
          .lean()
      } else {
        // Your existing code for permission check
        leadsData = await Leads.find({
          leadSource: { $ne: "facebook" },
          company: req.user.company._id,
          $or: [
            { leadCreatedBy: req.user._id },
            {
              users: {
                $elemMatch: {
                  id: req.user._id,
                  $or: [
                    { currentUser: true },
                    { leadStatus: "ACCEPTED" },
                    { leadStatus: "REJECTED" },
                  ],
                },
              },
            },
          ],
        })
          .populate("leadCreatedBy", { firstName: 1, lastName: 1, _id: 0 })
          .populate("users.id", "firstName lastName")
          .sort({ createdAt: -1 })
          .lean()
      }
      // Add the userAssociated field to the leadsData
      const updatedLeadsData = leadsData.map((lead) => ({
        ...lead,
        userAssociated: lead.users.find((user) => user.currentUser)?.id
          ? `${lead.users.find((user) => user.currentUser).id.firstName} ${
              lead.users.find((user) => user.currentUser).id.lastName
            }`
          : null,
      }))
      return res.status(200).json({
        code: "SUCCESS",
        data: updatedLeadsData,
      })
    } catch (error) {
      console.log(error)
      return res.status(500).json({
        code: "ERROR",
        message: "Internal Server Error",
      })
    }
  },
  generateLead: async (req, res) => {
    try {
      // console.log(req.user);
      const isLeadExist = await Leads.findOne({
        phone: req.body.phone,
        email: req.body.email,
        company: req.user.company._id,
      })
      if (isLeadExist) {
        return res.status(409).json({
          code: "DUPLICATE",
          data: null,
          message:
            "Duplicate email or phone number, use another email or phone!",
        })
      }
      // console.log(followUpInfoInBody);
      let leadDataObj = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        date: req.body.date,
        time: req.body.time,
        description: req.body.description,
        email: req.body.email,
        leadSource: req.body.leadSource,
        leadType: req.body.leadType,
        phone: req.body.phone,
        readytoRunBusiness: req.body.readytoRunBusiness,
        servicesEnquired: req.body.servicesEnquired,
        budget: req.body.budget,
        users: req.body.users,
        leadCreatedBy: req.user._id,
        currentStatus: req.body.currentStatus,
        state: req.body.state,
        city: req.body.city,
        country: req.body.country,
        company: req.user.company._id,
        reminderCall: req.body.reminderCall,
        followUpInfo: req.body.followUpInfo,
        createdDate: moment().format("DD-MM-YYYY"),
        createdTime: moment().format("hh:mm A"),
      }

      if (req.body.users) {
        let usersArray = req.body.users
        usersArray[0].assignedDate = moment().format("DD-MM-YYYY hh:mm A")
      }
      // console.log(leadDataObj);
      const leadGenerated = await Leads.create(leadDataObj)
      const history = await LeadHistory.create({
        leadId: leadGenerated._id,
        action: "Lead Generated",
        actionBy: `${req.user.firstName}  ${req.user.lastName}`,
        company: req.user.company._id,
        date: moment().format("DD-MM-YYYY"),
        time: moment().format("hh:mm A"),
      })
      return res.status(201).json({
        code: "SUCCESS",
        data: leadGenerated,
        history,
      })
    } catch (error) {
      console.log(error)
      return res.status(500).json({
        code: "ERROR",
        data: error.message,
      })
    }
  },
  reasonForRejectionStatus: async (req, res) => {
    try {
      const { leadId, reasonForRejection } = req.body
      const userId = req.user._id

      // Find the lead with the matched condition
      const leadsData = await Leads.findOne({
        _id: leadId,
        "users.id": userId,
        "users.currentUser": false,
        "users.leadStatus": "REJECTED",
      })

      if (!leadsData) {
        return notFoundResponse(res, "No such lead to give reason!", "")
      }

      // Find the user object that matches the condition and has the prevUser
      const userToDelete = leadsData.users.find(
        (user) => user.id.toString() === userId.toString()
      )
      const prevUserId = userToDelete.prevUser

      // Delete the matched user object from the users array
      await Leads.updateOne(
        { _id: leadId },
        {
          $pull: {
            users: { id: userId },
          },
        }
      )

      // Find the user object with the matching prevUser and update its currentUser
      await Leads.updateOne(
        { _id: leadId, "users.id": prevUserId },
        {
          $set: {
            "users.$.currentUser": true,
          },
        }
      )

      await LeadHistory.create({
        leadId: leadsData._id,
        action: "Lead rejected due to " + reasonForRejection,
        actionBy: `${req.user.firstName}  ${req.user.lastName}`,
        company: req.user.company._id,
        date: moment().format("DD-MM-YYYY"),
        time: moment().format("hh:mm A"),
      })

      await Tracker.findOneAndUpdate(
        {
          leads: leadsData._id,
          company: req.user.company._id,
          user: req.user._id,
        },
        {
          description: reasonForRejection,
        }
      )

      return res.status(200).json({
        code: "SUCCESS",
        message: leadsData,
      })
    } catch (error) {
      console.log(error)
      return res.status(500).json({
        code: "ERROR",
        message: "Something went wrong while updating the lead!",
      })
    }
  },
  acceptLead: async (req, res) => {
    try {
      const currentDate = new Date()
      const { leadId } = req.body
      const userId = req.user._id
      let prevUserId

      // Find the lead and the user with currentUser set to true
      const leadsData = await Leads.findOneAndUpdate(
        {
          _id: leadId,
          users: {
            $elemMatch: {
              id: userId,
              currentUser: true,
              targetTime: { $gt: currentDate },
              leadStatus: "PENDING",
            },
          },
        },
        {
          $set: {
            "users.$.leadStatus": "ACCEPTED",
          },
        },
        { new: true }
      )

      if (!leadsData) {
        return notFoundResponse(
          res,
          "No such lead found for you to accept!",
          ""
        )
      }

      // console.log( leadsData.users);
      // Find the user object in the users array matching req.user._id
      for (const user of leadsData.users) {
        if (user.id.toString() === req.user._id.toString()) {
          prevUserId = user.prevUser
          break
        }
      }

      await LeadHistory.create({
        leadId: leadsData?._id,
        action: "Lead accepted",
        actionBy: `${req.user.firstName} ${req.user.lastName}`,
        company: req.user.company._id,
        date: moment().format("DD-MM-YYYY"),
        time: moment().format("hh:mm A"),
      })
      // console.log(prevUserId)
      await Tracker.create({
        user: req.user._id,
        leads: leadsData?._id,
        action: "accepted",
        company: req.user.company._id,
        userActionDate: moment().format("DD-MM-YYYY"),
        userActionTime: moment().format("hh:mm A"),
        manager: prevUserId,
      })

      return res.status(200).json({
        code: "SUCCESS",
        message: leadsData,
      })
    } catch (error) {
      console.log(error)
      return res.status(500).json({
        code: "ERROR",
        message: "Something went wrong while updating the lead!",
      })
    }
  },
  rejectLead: async (req, res) => {
    try {
      let leadId = req.body.leadId
      const rejectedLead = await Leads.findOneAndUpdate(
        {
          _id: leadId,
          company: req.user.company._id,
          users: {
            $elemMatch: {
              id: req.user._id,
              leadStatus: "PENDING",
            },
          },
        },
        {
          $set: {
            "users.$.leadStatus": "REJECTED",
          },
        }
      )
      if (!rejectedLead)
        return notFoundResponse(res, "No lead to reject there!", "")
      // Find the user object in the users array matching req.user._id
      let prevUserId
      for (const user of rejectedLead.users) {
        if (user.id.toString() === req.user._id.toString()) {
          prevUserId = user.prevUser
          break
        }
      }
      console.log("rejectedLead : ", rejectedLead)
      await LeadHistory.create({
        leadId: leadId,
        action: "Lead rejected ",
        actionBy: `${req.user.firstName}  ${req.user.lastName}`,
        company: req.user.company._id,
        date: moment().format("DD-MM-YYYY"),
        time: moment().format("hh:mm A"),
      })
      await Tracker.create({
        user: req.user._id,
        manager: prevUserId,
        leads: leadId,
        action: "rejected",
        company: req.user.company._id,
        userActionDate: moment().format("DD-MM-YYYY"),
        userActionTime: moment().format("hh:mm A"),
      })

      return fetchResponse(res, "Lead rejected and updated successfully", "")
    } catch (error) {
      console.error("Error rejecting lead:", error)
      return res.status(500).json({ message: "Internal server error!" })
    }
  },
  updateLeadInfo: async (req, res) => {
    const { leadId } = req.params
    const updateFields = req.body // Fields to update
    try {
      const lead = await Leads.findById(leadId)
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" })
      }
      const previousLeadData = { ...lead.toObject() }
      lead.set(updateFields)
      await lead.save()
      // Compare the entire updated document with the previous document to determine updated fields
      const updatedFields = []
      for (const key in previousLeadData) {
        if (
          key !== "updatedAt" && // Exclude "updatedAt"
          key !== "__v" && // Exclude "__v"
          JSON.stringify(previousLeadData[key]) !== JSON.stringify(lead[key])
        ) {
          updatedFields.push(key)
        }
      }
      // Create a LeadHistory document
      await LeadHistory.create({
        leadId,
        action: "Lead information updated",
        fieldsUpdated: updatedFields,
        actionBy: `${req.user.firstName} ${req.user.lastName}`,
        company: req.user.company._id,
        date: moment().format("DD-MM-YYYY hh:mm A"),
        time: moment().format("hh:mm A"),
      })
      return res.status(200).json({
        message: "Lead updated successfully",
        updatedFields,
      })
    } catch (error) {
      console.log(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  },
  getLeadByLeadId: async (req, res) => {
    try {
      const leadsData = await Leads.findById(req.params.leadId)
        .populate("users.id")
        .populate("leadCreatedBy", { firstName: 1, lastName: 1, _id: 0 })
        .lean()

      // Check if leadsData has the 'users' array
      if (leadsData && Array.isArray(leadsData.users)) {
        // Transform the 'users' array
        const transformedUsers = leadsData.users.map((user) => {
          const { _id, firstName, lastName } = user.id
          const {
            targetTime,
            currentUser,
            reasonForRejection,
            leadStatus,
            role,
          } = user

          return {
            id: _id,
            firstName,
            lastName,
            targetTime,
            currentUser,
            reasonForRejection,
            leadStatus,
            role,
          }
        })

        // Replace the 'users' array in leadsData with the transformedUsers
        leadsData.users = transformedUsers
      }

      return fetchResponse(res, "FETCHED", leadsData)
    } catch (error) {
      return errorResponse(
        res,
        "Something went wrong while fetching lead!",
        error.message
      )
    }
  },
  fetchFbCampaign: async (req, res) => {
    const permissions = ["read", "create", "delete", "update"] // Define the required permissions
    const hasPermissions = permissions.every((requiredPermission) =>
      req.user.role.permission.some(
        (userPermission) => userPermission.value === requiredPermission
      )
    )

    if (!hasPermissions) {
      return unauthorizedResponse(
        res,
        "Insufficient permissions to fetch the campaign!",
        null
      )
    }
    const accessToken = process.env.FB_ACCESS_TOKEN
    const adAccountId = process.env.FB_ACCOUNT_ID
    const fields = "id,name,objective"
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${adAccountId}/adsets?fields=${fields}&access_token=${accessToken}`
      )
      const adSets = response.data.data
      return fetchResponse(res, "Campaign data fetched!", adSets)
    } catch (error) {
      console.error("Error fetching campaigns:", error.message)
      return errorResponse(
        res,
        "Something went wrong while fetching campaign",
        ""
      )
    }
  },
  fetchLeadsForCampaign: async (req, res) => {
    try {
      const permissions = ["read", "create", "delete", "update"] // Define the required permissions
      const hasPermissions = permissions.every((requiredPermission) =>
        req.user.role.permission.some(
          (userPermission) => userPermission.value === requiredPermission
        )
      )

      if (!hasPermissions) {
        return unauthorizedResponse(
          res,
          "Insufficient permissions to fetch the leads!",
          null
        )
      }
      const accessToken = process.env.FB_ACCESS_TOKEN

      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${req.body.campignLeadId}/ads?fields=id,adset{id},name&access_token=${accessToken}`
      )
      const leads = response.data.data
      console.log(leads)
      const responsedata = await axios.get(
        `https://graph.facebook.com/v18.0/${leads[0].id}/leads?access_token=${accessToken}`
      )
      let campaign_name = leads[0].name
      const finalLeads = responsedata.data.data
      // console.log(finalLeads);
      // return res.send(finalLeads)
      const allLeads = await saveLeadsFromResponse(
        req,
        campaign_name,
        finalLeads
      )

      return fetchResponse(res, "Leads data fetched!", allLeads)

      // console.log("Leads for Campaign", finalLeads)
    } catch (error) {
      console.error("Error fetching leads:", error)
      return errorResponse(
        res,
        "Something went wrong while fetching the leads data!",
        ""
      )
    }
  },
  trashLeads: async (req, res) => {
    try {
      const permissions = ["read", "create", "delete", "update"] // Define the required permissions
      const hasPermissions = permissions.every((requiredPermission) =>
        req.user.role.permission.some(
          (userPermission) => userPermission.value === requiredPermission
        )
      )

      if (!hasPermissions) {
        return unauthorizedResponse(
          res,
          "Insufficient permissions to trash the lead!",
          null
        )
      }
      const leadTrashed = await Leads.findByIdAndUpdate(req.params.leadId, {
        $set: { isTrashed: true },
      })
      console.log(leadTrashed)
      if (leadTrashed) {
        return fetchResponse(res, "Lead moved to trash!", "")
      } else {
        return fetchResponse(res, "Lead does not exist!", "")
      }
    } catch (error) {
      console.log(error)
      return errorResponse(res, "Something went wrong while trashing lead!", "")
    }
  },
  deleteLeads: async (req, res) => {
    try {
      const ids = req.body
      console.log(ids, "IDS")
      // Loop through each ID and update the corresponding document
      const updatePromises =
        ids &&
        ids.map(async (id) => {
          const result = await Leads.updateOne(
            { _id: id },
            { $set: { isTrashed: true } }
          )
          return result
        })

      // Wait for all updates to complete
      const updateResults = await Promise.all(updatePromises)
      // Count the number of successful updates
      const modifiedCount = updateResults.filter(
        (result) => result.nModified > 0
      ).length

      res.json({ message: `Deleted  items` })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },
  getLeadsByCampaignName: async (req, res) => {
    try {
      const campaignLeads = await Leads.find({
        campaignName: req.body.campaign_name,
      }).lean()
      return fetchResponse(res, "Campaign Leads Fetched!", campaignLeads)
    } catch (error) {
      console.log(error)
      return errorResponse(
        res,
        "Something went wrong while fetching campaign leads!",
        ""
      )
    }
  },
  assignMultipleLeads: async (req, res) => {
    try {
      // Define the required permissions
      const permissions = ["read", "create", "delete", "update"]

      // Check if the user has all the required permissions
      const hasAllPermissions = permissions.every((requiredPermission) =>
        req.user.role.permission.some(
          (userPermission) => userPermission.value === requiredPermission
        )
      )

      // Create the matchQuery based on permissions and user ID
      const matchQuery = {
        _id: { $in: req.body.leadIds },
      }

      if (!hasAllPermissions) {
        matchQuery["users"] = {
          $elemMatch: {
            id: req.user._id,
            leadStatus: "ACCEPTED",
            currentUser: true,
          },
        }
      }
      const assignedUser = req.body.userId
      const leads = await Leads.find(matchQuery)
      if (leads.length <= 0) {
        return notFoundResponse(res, "There is no lead to assign!", "")
      }
      for (const lead of leads) {
        // Update the user properties if the current user is in the lead's users array
        const matchingUserIndex = lead.users.findIndex(
          (user) => user.id.toString() === req.user._id.toString()
        )
        if (matchingUserIndex !== -1) {
          lead.users[matchingUserIndex].currentUser = false
          lead.users[matchingUserIndex].nextUser = assignedUser
        }
        let firstUser = {
          id: assignedUser,
          prevUser: req.user._id,
          assignedDate: moment().format("DD-MM-YYYY hh:mm A"),
          assignedTime: moment().format("hh:mm A"),
          leadStatus: "PENDING",
          currentUser: true,
        }
        lead.users.unshift(firstUser)
        // Save the updated lead
        await lead.save()
      }
      return fetchResponse(res, "Leads assigned successfully!", "")
    } catch (error) {
      log(error)
      return errorResponse(
        res,
        "Something went wrong while assigning leads!",
        ""
      )
    }
  },
}
