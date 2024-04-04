const { Leads } = require("../leadSource/model")
const { fetchResponse, errorResponse } = require("../utils/response")
const moment = require("moment")
const usersLeadData = async (req, res) => {
  try {
    const permissions = ["read", "create", "delete", "update"] // Define the required permissions
    const hasPermissions = permissions.every((requiredPermission) =>
      req.user.role.permission.some(
        (userPermission) => userPermission.value === requiredPermission
      )
    )
    // Define an array of lead types you want to include in the response
    const leadTypesToInclude = [
      "warm-lead",
      "hot-lead",
      "cold-lead",
      "closed-lead",
    ]
    const userId = req.user._id // Assuming you have the req.user._id available
    const company = req.user.company._id
    let matchObj = {
      company,
      leadType: { $in: leadTypesToInclude },
    }
    if (!hasPermissions) {
      matchObj["users"] = { $elemMatch: { id: userId, currentUser: true } }
    }
    // Create an aggregation pipeline based on the lead types to include
    const pipeline = [
      {
        $match: matchObj,
      },
      {
        $group: {
          _id: "$leadType",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          leadType: "$_id",
          count: 1,
        },
      },
    ]
    const result = await Leads.aggregate(pipeline)
    // Create an object with zero counts for missing lead types
    const response = leadTypesToInclude.reduce((acc, leadType) => {
      const foundLead = result.find((item) => item.leadType === leadType)
      acc.push({
        leadType,
        count: foundLead ? foundLead.count : 0,
      })
      return acc
    }, [])

    return res.status(200).json({
      code: "SUCCESS",
      data: response,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      code: "ERROR",
      message: "Internal Server Error",
    })
  }
}
const todaysLead = async (req, res) => {
  try {
    const permissions = ["read", "create", "delete", "update"] // Define the required permissions
    const hasPermissions = permissions.every((requiredPermission) =>
      req.user.role.permission.some(
        (userPermission) => userPermission.value === requiredPermission
      )
    )
    matchQuery = {}
    matchQuery["company"] = req.user.company._id
    if (hasPermissions) {
      matchQuery["createdDate"] = moment().format("DD-MM-YYYY hh:mm A")
    } else {
      matchQuery["users"] = {
        $elemMatch: {
          id: req.user._id,
          currentUser: true,
          assignedDate: moment().format("DD-MM-YYYY")
        },
      }
    }

    const result = await Leads.find(matchQuery)
    // console.log(result);
    return res.status(200).json({
      code: "SUCCESS",
      data: result,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      code: "ERROR",
      message: "Internal Server Error",
    })
  }
}
const penVsAccVsRej = async (req, res) => {
  try {
    const userId = req.user._id // Assuming you have the req.user._id available
    const { startDate, endDate, today } = req.query // Assuming you get date parameters as query parameters

    const matchQuery = {
      "users.id": userId,
    }

    // Add date range filtering if startDate and endDate parameters are provided
    if (startDate && endDate) {
      matchQuery.formattedCreatedAt = {
        $gte: startDate,
        $lte: endDate,
      }
    }

    // Add filtering for today's date if the 'today' parameter is provided
    if (true) {
      const todayDate = new Date().toISOString().split("T")[0]
      matchQuery.formattedCreatedAt = todayDate
    }

    const result = await Leads.aggregate([
      {
        $unwind: "$users",
      },
      {
        $match: {
          "users.id": userId,
        },
      },
      {
        $addFields: {
          formattedCreatedAt: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
        },
      },
      {
        $match: matchQuery,
      },
      {
        $group: {
          _id: "$users.leadStatus",
          count: { $sum: 1 },
        },
      },
    ])

    // Initialize leadCounts with default values
    const leadCounts = {
      pending: 0,
      rejected: 0,
      accepted: 0,
    }

    // Populate leadCounts based on the aggregation result
    result.forEach((entry) => {
      if (entry._id === "PENDING") {
        leadCounts.pending = entry.count
      } else if (entry._id === "REJECTED") {
        leadCounts.rejected = entry.count
      } else if (entry._id === "ACCEPTED") {
        leadCounts.accepted = entry.count
      }
    })

    return res.status(200).json({
      code: "SUCCESS",
      data: leadCounts,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      code: "ERROR",
      message: "Internal Server Error",
    })
  }
}
const leadSourceData = async (req, res) => {
  try {
    const permissions = ["read", "create", "delete", "update"] // Define the required permissions
    const hasAllPermissions = permissions.every((requiredPermission) =>
      req.user.role.permission.some(
        (userPermission) => userPermission.value === requiredPermission
      )
    )

    const company = req.user.company._id

    // Define an array of lead sources you want to include in the response
    const leadSourcesToInclude = [
      "facebook",
      "employee-ref",
     
      "web-referal",
      "google",
      "linkdin", // Added "google-ads" to the array
      "just-dial",
      "other"
    ];

    // Create a match query to filter based on the specified lead sources
    const matchQuery = {
      company,
      leadSource: { $in: leadSourcesToInclude },
    }

    if (!hasAllPermissions) {
      matchQuery["users.id"] = req.user._id
      matchQuery["users.currentUser"] = true
    }

    const data = await Leads.aggregate([
      {
        $match: matchQuery,
      },
      {
        $group: {
          _id: "$leadSource",
          count: { $sum: 1 },
        },
      },
    ])

    // Create an object with zero counts for missing lead sources
    const response = leadSourcesToInclude.map((leadSource) => ({
      leadSource,
      count: 0, // Default to zero count
    }))

    // Update counts for lead sources that exist in the aggregation result
    data.forEach((item) => {
      const index = response.findIndex((entry) => entry.leadSource === item._id)
      if (index !== -1) {
        response[index].count = item.count
      }
    })

    return fetchResponse(res, "Lead source count fetched!", response)
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      code: "ERROR",
      message: "Internal Server Error",
    })
  }
}
const tickerAPIReminderCall = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set the time to the start of the day (midnight)

    let matchQuery = {
      company: req.user.company._id,
    }

    const permissions = ["read", "create", "delete", "update"]

    // Check if the user has all required permissions
    const hasAllPermissions = permissions.every((requiredPermission) =>
      req.user.role.permission.some(
        (userPermission) => userPermission.value === requiredPermission
      )
    )

    if (!hasAllPermissions) {
      matchQuery.users = {
        $elemMatch: {
          id: req.user._id,
          currentUser: true,
          leadStatus: "ACCEPTED",
        },
      }
    }

    // Use Mongoose's aggregate method to perform the aggregation
    const reminders = await Leads.aggregate([
      {
        $match: matchQuery,
      },
      {
        $match: {
          reminderCall: today,
        },
      },
    ]).exec()

    // Map the reminders and format the messages
    const reminderMessages = reminders.map((reminder) => {
      const { firstName, lastName } = reminder
      const reminderCallTime = reminder.reminderCall.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
      return `You have a call with ${firstName} ${lastName} at ${reminderCallTime}`
    })

    return res.status(200).json({
      code: "SUCCESS",
      data: reminderMessages,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      code: "ERROR",
      message: "Internal Server Error",
    })
  }
}
const getFacebookLeads = async (req, res) => {
  try {
    // console.log(req.user);
    const permissionLength = req.user.role.permission.length
    let leadsData

    if (permissionLength == 5 || permissionLength == 4) {
      leadsData = await Leads.find({ leadSource: "facebook" })
        .populate("leadCreatedBy", "firstName lastName")
        .populate("users.id", "firstName lastName")
        .sort({ createdAt: -1 })
        .lean()
    } else {
      // Your existing code for permission check
      const userId = req.user._id
      const currentDate = new Date()
      leadsData = await Leads.find({
        leadSource: "facebook",
        $or: [
          {
            leadCreatedBy: req.user._id,
          },
          {
            users: {
              $elemMatch: {
                id: req.user._id,
                currentUser: true,
              },
            },
          },
          {
            users: {
              $elemMatch: {
                id: req.user._id,
                leadStatus: "ACCEPTED",
              },
            },
          },
          {
            users: {
              $elemMatch: {
                id: req.user._id,
                leadStatus: "REJECTED",
                reasonForRejection: null,
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
}
const getAllUnassignedLeads = async (req, res) => {
  try {
    // console.log(req.user);
    const permissionLength = req.user.role.permission.length
    let leadsData

    if (permissionLength !== 4) {
      return errorResponse(res, "Not authorized!", "")
    }
    // Add the userAssociated field to the leadsData
    leadsData = leadsData = await Leads.find({
      "users.0": { $exists: false },
      company: req.user.company._id,
    })
    let responseObj = {}
    responseObj["lead_data"] = leadsData
    responseObj["number_of_leads"] = leadsData.length
    return fetchResponse(res, "Un-assigned Leads Fetched!", responseObj)
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      code: "ERROR",
      message: "Internal Server Error",
    })
  }
}
const getAllAssignedLeads = async (req, res) => {
  try {
    // console.log(req.user);
    const permissionLength = req.user.role.permission.length
    let leadsData
    let matchQuery = {}
    matchQuery["company"] = req.user.company._id
    if (permissionLength === 4) {
      // When permissionLength is 4, use $exists
      matchQuery["users.0"] = { $exists: true }
    } else {
      // When permissionLength is not 4, use $elemMatch
      matchQuery["users"] = {
        $elemMatch: {
          id: req.user._id,
          leadStatus: "ACCEPTED",
        },
      }
    }
    // Add the userAssociated field to the leadsData
    leadsData = leadsData = await Leads.find(matchQuery)
      .populate("leadCreatedBy", { firstName: 1, lastName: 1, _id: 0 })
      .populate("users.id", "firstName lastName")
      .sort({ createdAt: -1 })
      .lean()
    // console.log(leadsData);
    // Add the userAssociated field to the leadsData
    const updatedLeadsData = leadsData.map((lead) => ({
      ...lead,
      userAssociated: lead.users.find((user) => user.currentUser)?.id
        ? `${lead.users.find((user) => user.currentUser).id.firstName} ${
            lead.users.find((user) => user.currentUser).id.lastName
          }`
        : null,
    }))
    let responseObj = {}
    responseObj["lead_data"] = updatedLeadsData
    responseObj["number_of_leads"] = leadsData.length
    return fetchResponse(res, "Assigned Leads Fetched!", responseObj)
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      code: "ERROR",
      message: "Internal Server Error",
    })
  }
}
const getClosedLeads = async (req, res) => {
  try {
    // console.log(req.user);
    const permissionLength = req.user.role.permission.length
    let leadsData

    if (permissionLength !== 4) {
      return errorResponse(res, "Not authorized!", "")
    }
    // Add the userAssociated field to the leadsData
    leadsData = leadsData = await Leads.find({
      isCompleted: true,
      company: req.user.company._id,
    })
    let responseObj = {}
    responseObj["lead_data"] = leadsData
    responseObj["number_of_leads"] = leadsData.length
    return fetchResponse(res, "Closed Leads Fetched!", responseObj)
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      code: "ERROR",
      message: "Internal Server Error",
    })
  }
}
const getTotalLeads = async (req, res) => {
  try {
    const permissionLength = req.user.role.permission.length
    let leadsData
    let matchQuery = {}
    matchQuery["company"] = req.user.company._id
    if (permissionLength !== 4) {
      matchQuery["users"] = {
        $elemMatch: {
          id: req.user._id,
          $or: [
            {
              currentUser: true,
              // leadSource:{$in:['facebook']}
            },
            {
              currentUser: false,
              leadStatus: "REJECTED",
              reasonForRejection: "",
              // leadSource:{$in:['facebook']}
            },
          ],
        },
      }
    }
    // console.log(matchQuery);
    // Add the userAssociated field to the leadsData
    leadsData = leadsData = await Leads.find(matchQuery)
      .populate("leadCreatedBy", { firstName: 1, lastName: 1, _id: 0 })
      .populate("users.id", "firstName lastName")
      .sort({ createdAt: -1 })
      .lean()
    console.log(leadsData)
    // Add the userAssociated field to the leadsData
    const updatedLeadsData = leadsData.map((lead) => ({
      ...lead,
      userAssociated: lead.users.find((user) => user.currentUser)?.id
        ? `${lead.users.find((user) => user.currentUser).id.firstName} ${
            lead.users.find((user) => user.currentUser).id.lastName
          }`
        : null,
    }))
    let responseObj = {}
    responseObj["lead_data"] = updatedLeadsData
    responseObj["number_of_leads"] = leadsData.length
    return fetchResponse(res, "Total Leads Fetched!", responseObj)
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      code: "ERROR",
      message: "Internal Server Error",
    })
  }
}
const getMeetings = async (req, res) => {
  try {
    let userId = req.user._id
    const currentDate = moment().format("DD-MM-YYYY") // Get today's date in DD-MM-YYYY format
    const leads = await Leads.find({
      users: {
        $elemMatch: {
          id: userId, // Filter by user._id
          currentUser: true, // Ensure currentUser is true,
          leadStatus: "ACCEPTED",
        },
      },
      // "followUpInfo.targetDate": currentDate, // Filter by today's date
    })
    // console.log(currentDate);
    const formattedData = leads.map((lead) => {
      const fullName = `${lead.firstName} ${lead.lastName}`
      return lead.followUpInfo
        .filter(
          (info) => info.targetDate == currentDate && info.isCompleted === false
        )
        .map((info) => ({
          relatedTo: fullName,
          subject: info.subject,
          targetTime: info.targetTime,
          targetDate: info.targetDate,
          purpose: info.purpose,
          notes: info.notes,
          location: info.location,
          isCompleted: info.isCompleted,
          completionTime: info.completionTime,
          completionDate: info.completionDate,
        }))
    })
    // console.log("formattedData : ", formattedData)
    // Flatten the array and remove any empty arrays
    const followUpData = formattedData.flat()
    return fetchResponse(res, "Meetings fetched!", followUpData)
  } catch (error) {
    console.log(error)
    return errorResponse(
      res,
      "Something went wrong while fetching meetings details!",
      ""
    )
  }
}
const getPipelineLead = async (req, res) => {
  Leads.aggregate([
    {
      $match: {
        company: req.user.company._id,
        leadType: "hot-lead",
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        leads: { $push: "$$ROOT" },
      },
    },
  ])
    .then((result) => {
      // console.log(result)
      if (result.length > 0) {
        const count = result[0].count;
        const hotLeads = result[0].leads;
        return fetchResponse(res, "Hot Leads:", hotLeads)
        // console.log(`Number of hot leads: ${count}`);
        // console.log("Hot Leads:", hotLeads);
      } else {
        return errorResponse("No hot leads found for this company.")
      }
    })
    .catch((err) => {
      // Handle the error
    });
}
const leadTypeData = async (req,res)=>{
  try {
    const permissions = ["read", "create", "delete", "update"]; // Define the required permissions
    const hasAllPermissions = permissions.every((requiredPermission) =>
      req.user.role.permission.some(
        (userPermission) => userPermission.value === requiredPermission
      )
    );
    const company = req.user.company._id;
    // Define an array of lead sources you want to include in the response
    const leadTypeToInclude = [
      "none",
      "attempted-to-contact",
     "cold-lead",
      "warm-lead",
      "hot-lead",
      "contact-in-future", // Added "google-ads" to the array
      "Contacted",
      "Junk-lead",
      "Lost-lead",
      // "not-Contacted",
      // "Pre-Qualified",  
      // "not-Qualified",
      "client"
    ];

    // Create a match query to filter based on the specified lead sources
    const matchQuery = {
      company,
      leadType: { $in: leadTypeToInclude },
    };
    if (!hasAllPermissions) {
      matchQuery["users.id"] = req.user._id;
      matchQuery["users.currentUser"] = true;
    }

    const data = await Leads.aggregate([
      {
        $match: matchQuery,
      },
      {
        $group: {
          _id: "$leadType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Create an object with zero counts for missing lead sources
    const response = leadTypeToInclude.map((leadType) => ({
      leadType,
      count: 0, // Default to zero count
    }));

    // Update counts for lead sources that exist in the aggregation result
    data.forEach((item) => {
      const index = response.findIndex(
        (entry) => entry.leadType === item._id
      );
      if (index !== -1) {
        response[index].count = item.count;
      }
    });

    return fetchResponse(res, "Lead source count fetched!", response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "ERROR",
      message: "Internal Server Error",
    });
  }
}
const allLeadCount = async (req,res)=>{
  try {
    const countResult = await Leads.aggregate([
      {
        $group: {
          _id: '$status',
          name: { $first: 'Total number of leads' }, // Using $first to pick the first encountered value (which is constant here)
          value: { $sum: 1 },
          color: { $first: '#dc305b' } // Similarly, using $first for a constant color
        }
      }
    ]);

    return fetchResponse(res, "Total Leads count!", countResult)
  } catch (err) {
    console.log(err);
    return errorResponse(
      res,
      "Something went wrong while fetching meetings details!",
      ""
    )
  }


}
const monthwiseLeads = async (req,res)=>{
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // Months are 0-indexed in JavaScript (0 for January)

    const countResult = await Leads.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $year: '$createdAt' }, year] },
              { $eq: [{ $month: '$createdAt' }, month] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]);

    if (countResult.length > 0) {
      return fetchResponse(res, "Total Leads count!", countResult[0].count)
  
    } else {
      return fetchResponse(res, "Total Leads count!",0)
      res.json(0); // Return 0 if there are no leads for the current month
    }
  } catch (err) {
    return errorResponse(
      err,
      "Something went wrong while fetching meetings details!",
      ""
    )
  }
}
module.exports = {
  usersLeadData,
  todaysLead,
  penVsAccVsRej,
  leadSourceData,
  tickerAPIReminderCall,
  getAllAssignedLeads,
  getAllUnassignedLeads,
  getFacebookLeads,
  getMeetings,
  getClosedLeads,
  getTotalLeads,
  getPipelineLead,
  leadTypeData,
  allLeadCount,
  monthwiseLeads
};
