const express = require("express")
const cors = require("cors")
const connect = require("./config/connect")
var bodyParser = require("body-parser")
const path = require("path")
const helmet = require("helmet")
require("dotenv").config()
const exchangeTokenTime = 15 * 60 * 1000 // 15 minutes
const app = express()
app.use(express.json({ urlencoded: true }))
connect()
app.use(cors())
app.use(helmet())
app.use(express.static(path.join(__dirname, "/public")))
app.use(bodyParser.urlencoded({ extended: true }))


const authRouter = require("./Auth/router.js")
const planRouter = require("./plan/router.js")
const companyRouter = require("./company/router")
const roleRouter = require("./role/router")
const verifyRouter = require("./verify/router")
const leadRouter = require("./leadSource/router")
const leadHistoryRouter = require("./history/router")
const dashboardRouter = require("./Dashboard/router")
const notesRouter = require("./notes/router")
const invoiceRouter = require("./invoices/route")
const productRouter = require("./product/router")
const trackerRouter = require("./userTracker/router")
const { exchangeToken } = require("./utils/exchangeFbToken")

app.use("/auth", authRouter)
app.use("/tracker", trackerRouter)
app.use("/product", productRouter)
app.use("/company", companyRouter)
app.use("/notes", notesRouter)
app.use("/dashboard", dashboardRouter)
app.use("/history", leadHistoryRouter)
app.use("/plan", planRouter)
app.use("/role", roleRouter)
app.use("/verify", verifyRouter)
app.use("/leadSource", leadRouter)
app.use("/invoice", invoiceRouter)


// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error)
  process.exit(1)
})
// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Promise Rejection:", reason)
})
setInterval(exchangeToken, exchangeTokenTime)
app.listen(5000, () => {
  console.log("Port is running on 5000...")
})
