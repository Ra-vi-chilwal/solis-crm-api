const { addCompany, getCompany } = require("./controller")
const { checkToken } = require("../middleware")
const companyRouter = require("express").Router()
const multer = require("multer")
// Storage configuration for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Specify the directory where uploaded files will be stored
    cb(null, `${__dirname}/../public/uploads/`)
  },
  filename: function (req, file, cb) {
    // Rename the file to avoid conflicts (you can customize the filename logic)
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + "." + file.mimetype.split("/")[1]
    )
  },
})

// Create a Multer instance with the storage configuration
const upload = multer({ storage: storage })
companyRouter.post("/add", checkToken, upload.single("companyLogo"), addCompany)
companyRouter.get("/get", checkToken, getCompany)
module.exports = companyRouter
