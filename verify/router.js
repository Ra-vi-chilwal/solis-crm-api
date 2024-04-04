const { verify } = require("./controller")
const { checkToken } = require("../middleware")
const Router = require("express").Router()
Router.post("/", verify)

module.exports = Router
