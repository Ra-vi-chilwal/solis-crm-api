const { checkToken } = require("../middleware")
const {
  register,
  login,
  getAllUser,
  logOut,
  getUserInfo,
  deleteUser,
  editUser,
} = require("./controller")
const { userValidationRules } = require("../Validation/authValidator")
const AuthRouter = require("express").Router()
AuthRouter.post("/register", checkToken, userValidationRules(), register)
AuthRouter.post("/login", login)
AuthRouter.get("/get", checkToken, getAllUser)
AuthRouter.post("/logout", logOut)
AuthRouter.get("/info", checkToken, getUserInfo)
AuthRouter.delete("/user/delete/:id", checkToken, deleteUser)
AuthRouter.post("/user/update/:id", checkToken, editUser)
module.exports = AuthRouter
