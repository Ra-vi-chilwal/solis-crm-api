const { updateAction,getNotifications } = require("./controller")
const { checkToken } = require("../middleware")
const Router = require("express").Router()
Router.put("/update/:id", checkToken, updateAction)
Router.get("/get", checkToken, getNotifications)
module.exports = Router
