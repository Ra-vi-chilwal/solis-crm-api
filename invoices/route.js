const router = require("express").Router()
const { checkToken } = require("../middleware")
const { generateInvoice, getInvoices } = require("./controller")

router.post("/generate", checkToken, generateInvoice)
router.get("/fetch/:id", checkToken, getInvoices)
module.exports = router
