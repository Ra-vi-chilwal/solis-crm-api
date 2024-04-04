const { Leads } = require("../leadSource/model")

module.exports = {
  // Function to save leads from the response
  saveLeadsFromResponse: async (req, campaign_name, responseData) => {
    const leadsToSave = []
    // Iterate through the response data
    for (const responseItem of responseData) {
      const leadData = {
        // Map response data to your schema fields
        firstName: "", // Initialize empty values for fields you don't have in the response
        lastName: "",
        date: responseItem.created_time,
        time: responseItem.created_time,
        description: "",
        email: "",
        leadSource: "facebook", // Assuming Facebook as the lead source
        leadType: "",
        phone: "",
        readytoRunBusiness: "",
        servicesEnquired: "",
        budget: "",
        campaignName: campaign_name, // You may need to populate this based on your data
        state: "",
        city: "",
        country: "", // Assuming a default country
        company: req.user.company._id, // Replace with your company's ObjectId
      }

      // Iterate through the field data
      for (const field of responseItem.field_data) {
        const fieldName = field.name
        const fieldValue = field.values[0] // Take the first value from the array

        // Map field data to the appropriate fields in your schema
        switch (fieldName) {
          case "email":
            leadData.email = fieldValue
            break
          case "full_name":
            const [firstName, lastName] = fieldValue.split(" ")
            leadData.firstName = firstName
            leadData.lastName = lastName
            break
          case "city":
            leadData.city = fieldValue
            break
          case "what_is_your_budget?":
            leadData.budget = fieldValue
            break
          case "phone_number":
            leadData.phone = fieldValue
            break
          case "are_you_already_running_a_business?":
            leadData.readytoRunBusiness = fieldValue
            break
          // Add more cases for other fields if necessary
        }
      }
      const existingLead = await Leads.findOne({
        $or: [{ email: leadData.email }, { phone: leadData.phone }],
      })

      if (existingLead) {
        // Handle duplicates, you can update the existing lead or skip it
        console.log(
          `Duplicate lead found for email: ${leadData.email} or phone: ${leadData.phone}`
        )
        continue
      }
      leadsToSave.push(leadData)
    }
    // console.log("leadsToSave : ", leadsToSave)
    // Save the leads to the database
    try {
      await Leads.create(leadsToSave)
      let campaignLeads = await Leads.find({ campaignName: campaign_name })
        .populate("leadCreatedBy", "firstName lastName")
        .populate("users.id", "firstName lastName")
        .sort({ createdAt: -1 })
        .lean()
      const updatedLeadsData = campaignLeads.map((lead) => ({
        ...lead,
        userAssociated: lead.users.find((user) => user.currentUser)?.id
          ? `${lead.users.find((user) => user.currentUser).id.firstName} ${
              lead.users.find((user) => user.currentUser).id.lastName
            }`
          : null,
      }))
      return updatedLeadsData
    } catch (error) {
      console.log(error)
      return this.errorResponse(
        res,
        "somethinf went wrong while fetrching FB leads of campaign!",
        ""
      )
    }
  },
}
//   processLeads: async () => {
//     try {
//       const currentDate = new Date()
//       const leadsToProcess = await Leads.find({
//         "users.targetTime": { $lt: currentDate },
//         "users.leadStatus": "PENDING",
//       })

//       // Parallelize processing using Promise.all
//       await Promise.all(
//         leadsToProcess.map(async (lead) => {
//           const rejectingUser = lead.users.find(
//             (user) => user.currentUser && user.leadStatus === "PENDING"
//           )

//           if (rejectingUser) {
//             const nextUserRole = determineNextRole(rejectingUser.role)
//             if (nextUserRole) {
//               updateUserRolesAndStatus(
//                 lead,
//                 rejectingUser,
//                 nextUserRole,
//                 currentDate
//               )
//               await lead.save()
//             }
//           }
//         })
//       )

//       console.log("Leads processed successfully")
//     } catch (error) {
//       console.error("Error processing leads:", error)
//     }
//   },
// }
// function updateUserRolesAndStatus(
//   lead,
//   rejectingUser,
//   nextUserRole,
//   currentDate
// ) {
//   rejectingUser.currentUser = false
//   rejectingUser.targetTime = null
//   rejectingUser.leadStatus = "REJECTED"

//   const nextUserIndex = lead.users.findIndex(
//     (user) => user.role === nextUserRole
//   )
//   if (nextUserIndex !== -1) {
//     const nextUser = lead.users[nextUserIndex]
//     nextUser.currentUser = true
//     nextUser.targetTime = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000) // Add one day
//   }
// }
// function determineNextRole(currentRole) {
//   const roleMap = {
//     TM1: "RM1",
//     RM1: "RM2",
//     RM2: "TM2",
//     RM3: "RM4",
//     TM2: null,
//     RM4: null,
//     // Add more cases as needed for other roles
//   }
//   return roleMap[currentRole] || null
// }
