const Router = require("express").Router()
const { checkToken } = require("../middleware")
const { getPlan, addPlan, storage, getUsersPlan } = require("./controller")
Router.get("/get", checkToken, getPlan)
Router.post("/add", checkToken, addPlan)
Router.get("/storage", checkToken, storage)
Router.get("/users", checkToken, getUsersPlan)
module.exports = Router
