const { Users } = require("./model")
const { hash, compare } = require("bcryptjs")
const {
  error,
  fetchResponse,
  errorResponse,
  notFoundResponse,
} = require("../utils/services")
const { sign } = require("jsonwebtoken")
var bcrypt = require("bcryptjs")
const { Role } = require("../role/model")
const { Token } = require("../token/model")
const { validationResult } = require("express-validator")

require("dotenv").config()
module.exports = {
  register: (req, res) => {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg)
      return res.status(422).json({ code: "ERROR", errors: errorMessages })
    }
    Users.findOne({ email: req.body.email }).then((user) => {
      if (user) {
        return res.json({
          code: "DUPLICATEDATA",
        })
      } else {
        hash(req.body.password, 8, (err, hash) => {
          if (hash) {
            const user = new Users({
              firstName: req.body.firstName,
              lastName: req.body.lastName,
              email: req.body.email,
              password: hash,
              company: req.body.company,
              gender: req.body.gender,
              dob: req.body.dob,
              role: req.body.role,
              company: req.body.company,
            })
            user.save().then(async (user) => {
              return res.status(200).json({
                code: "CREATED",
                data: user,
              })
            })
          }
        })
      }
    })
  },
  logOut: async (req, res) => {
    try {
      const authHeader = req.headers["authorization"]
      const token = authHeader && authHeader.split(" ")[1]
      if (!token) {
        return res.status(400).json({
          code: "ERROR",
          data: "Token not found!",
        })
      }
      // console.log(new Date());
      const expiredTokens = await Token.find({
        createdAt: { $gt: new Date() },
      })
      // console.log(expiredTokens);
      await Token.create({ token: token, isBlackListed: true })
      return res.status(400).json({
        code: "SUCCESS",
        data: "Logged out!",
      })
    } catch (error) {
      console.log(error.message)
      return res.status(400).json({
        code: "ERROR",
        data: "Something went wrong while logging out!",
      })
    }
  },
  getAllUser: async (req, res) => {
    try {
      const roleName = req.roleData?.slug
      let userList
      const data = req.roleData

      if (
        roleName === "superadmin" &&
        req.roleData?.permission?.some((item) => item.value === "root")
      ) {
        userList = await Users.find({})
          .populate("company")
          .populate("role")
          .sort([["createdAt", -1]])
      } else {
        userList = await Users.find({ company: req.user?.company })
          .populate("company")
          .populate("role")
          .sort([["createdAt", -1]])
      }

      return res.status(200).json({
        code: "FETCHED",
        data: userList,
      })
    } catch (error) {
      console.error(error)
      return res.status(400).json({
        code: "ERROROCCURED",
        data: error.message,
      })
    }
  },
  login: async (req, res, next) => {
    const { email, password } = req.body
    // Check if username and password is provided
    if (!email || !password) {
      return res.status(200).json({
        code: "ERROROCCURRED",
        data: "email or Password not present",
      })
    }
    try {
      const user = await Users.findOne({ email })
      if (!user) {
        res.status(200).json({
          code: "ERROROCCURRED",
          data: "User not found",
        })
      } else {
        // comparing given password with hashed password
        bcrypt
          .compare(password, user.password)
          .then(async function (result, err) {
            if (result) {
              const role = await Role.find({ _id: user.role })
              if (err) {
                return res.status(200).json({
                  code: "ERROROCCURRED",
                  data: err,
                })
              } else {
                user.password = undefined
                const token = sign(
                  {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    company: user.company,
                    role: role,
                  },
                  process.env.TOKEN_KEY,
                  {
                    expiresIn: "1d",
                  }
                )
                if (token) {
                  const user = await Users.findOne({ email })
                  await Users.findByIdAndUpdate(user._id, {
                    $set: {
                      isLoggedIn: true,
                      loggedInTime: new Date(),
                    },
                  })
                  return res.status(200).json({
                    code: "FETCHED",
                    token: token,
                  })
                }
              }
            } else {
              return res.status(200).json({
                code: "UNAUTHORISED",
                data: "User password is not correct",
              })
            }
          })
      }
    } catch (error) {
      res.status(200).json({
        message: "ERROROCCURRED",
        error: error.message,
      })
    }
  },
  getUserInfo: async (req, res) => {
    try {
      const id = req.user._id
      const company = req.user.company._id
      const userData = await Users.findOne(
        { _id: id, company },
        {
          _id: 0,
          firstName: 1,
          lastName: 1,
          profile: 1,
          email: 1,
          role: 1,
          gender: 1,
          company: 1,
          dob: 1,
        }
      )
        .populate("role", { title: 1, _id: 0, permission: 1 })
        .populate("company", { company: 1, _id: 0 })
        .lean()
      if (!userData) {
        return res.status(404).json({
          message: "ERROR",
          data: null,
          message: "User not found!",
        })
      }
      // Create the iconText field by taking the first letters of firstName and lastName
      const iconText = `${userData.firstName[0]}${userData.lastName[0]}`
      userData.iconText = iconText // Add iconText to the userData object
      return res.status(200).json({
        message: "SUCCESS",
        data: userData,
      })
    } catch (error) {
      return res.status(200).json({
        message: "ERROROCCURRED",
        error: error.message,
      })
    }
  },
  deleteUser: async (req, res) => {
    const userIdToDelete = req.params.id // Get the user ID to delete from request parameters
    const permissions = ["read", "create", "delete", "update"] // Define the required permissions
    const userCompanyId = req.user.company._id // Get the company ID from the logged-in user

    try {
      // Check if req.user.role.permission contains all required permissions
      const hasPermissions = permissions.every((requiredPermission) =>
        req.user.role.permission.some(
          (userPermission) => userPermission.value === requiredPermission
        )
      )
      if (!hasPermissions) {
        return notFoundResponse(
          res,
          "Insufficient permissions to delete a user",
          null
        )
      }
      // Now you can proceed with deleting the user by ID
      const deletedUser = await Users.findOneAndDelete({
        _id: userIdToDelete,
        company: userCompanyId,
      })
      if (!deletedUser) {
        return notFoundResponse(res, "User not found!", null)
      }
      return fetchResponse(res, "User deleted successfully!", deletedUser)
    } catch (error) {
      console.error(error)
      return errorResponse(res, "Internal Server Error", null)
    }
  },
  editUser: async (req, res) => {
    const userIdToEdit = req.params.id // Get the user ID to edit from request parameters
    const permissions = ["read", "create", "delete", "update"] // Define the required permissions
    const userCompanyId = req.user.company._id // Get the company ID from the logged-in user

    try {
      // Check if req.user.role.permission contains all required permissions
      const hasPermissions = permissions.every((requiredPermission) =>
        req.user.role.permission.some(
          (userPermission) => userPermission.value === requiredPermission
        )
      )

      if (!hasPermissions) {
        return fetchResponse(
          res,
          "Insufficient permissions to edit a user",
          null
        )
      }

      // Now you can proceed with finding and editing the user by ID
      // Ensure that the user being edited belongs to the same company as the logged-in user
      const updatedUser = await Users.findOneAndUpdate(
        {
          _id: userIdToEdit,
          company: userCompanyId,
        },
        { ...req.body }, // Update the user's data with the request body data
        { new: true, projection: { password: 0 } } // Return the updated user document
      )

      if (!updatedUser) {
        return notFoundResponse(res, "User not found!", null)
      }
      return fetchResponse(res, "User updated successfully", updatedUser)
    } catch (error) {
      console.error(error)
      return errorResponse(res, "Internal Server Error", null)
    }
  },
}
