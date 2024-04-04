const {
  errorResponse,
  notFoundResponse,
  fetchResponse,
} = require("../utils/response")
const { Tracker } = require("./model")
const moment = require("moment")

const updateAction = async (req, res) => {
  try {
    const updatedAction = await Tracker.findOneAndUpdate(
      {
        _id: req.params.id,
        company: req.user.company._id,
      },
      {
        $set: {
          managerAction: true,
          isJustified: req.body.isJustified,
          managerJustification: req.body.managerJustification,
          managerActionDate: moment().format("DD-MM-YYYY"),
          managerActionTime: moment().format("hh:mm A")
        },
      }
    )
    if (!updatedAction) return notFoundResponse(res, "Nothing to update!", "")
    return fetchResponse(res, "Action updated successfully!", "")
  } catch (error) {
    console.log(error)
    return errorResponse(res, "Something went wrong while updating action!", "")
  }
}

const getNotifications = async (req, res) => {
  try {
    const permissions = ["read", "create", "delete", "update"] // Define the required permissions
    const hasAllPermissions = permissions.every((requiredPermission) =>
      req.user.role.permission.some(
        (userPermission) => userPermission.value === requiredPermission
      )
    )
    const matchQuery = {
      company: req.user.company._id,
    }
    if (!hasAllPermissions) {
      matchQuery["manager"] = req.user._id
    }
    const notifications = await Tracker.findOne(matchQuery)
    .populate('user manager leads', 'firstName lastName -_id')
    return fetchResponse(res, "asdf", notifications)
    // console.log("Notifications : ", notifications); 
  } catch (error) {
    console.log(error)
    return errorResponse(
      res,
      "Something went wrong while fetching notifications!",
      ""
    )
  }
}

module.exports = {
  updateAction,
  getNotifications,
}
