const Router = require("express").Router()
const { checkToken } = require("../middleware")
const {
  addProduct,
  updateProduct,
  deleteProduct,
  getProduct,
} = require("./controller")

const setupFileUpload = require("../utils/fileUpload")
const upload = setupFileUpload()
Router.post("/add", checkToken, upload.array("files", 10), addProduct)
Router.patch(
  "/update/:id",
  checkToken,
  upload.array("files", 10),
  updateProduct
)
Router.delete("/delete/:id", checkToken, deleteProduct)
Router.get("/fetch", checkToken, getProduct)
module.exports = Router
