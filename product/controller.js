const {
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  createResponse,
  duplicateResponse,
  fetchResponse,
} = require("../utils/response")
const { Product } = require("./model")

const addProduct = async (req, res) => {
  try {
    const permissions = ["read", "create", "delete", "update"] // Define the required permissions
    const hasAllPermissions = permissions.every((requiredPermission) =>
      req.user.role.permission.some(
        (userPermission) => userPermission.value === requiredPermission
      )
    )
    if (!hasAllPermissions) {
      return unauthorizedResponse(
        res,
        "You are not authorized to add the product!",
        ""
      )
    }
    // console.log(req.files)
    let filesArray = []
    if (req.files.length > 0) {
      for (const file of req.files) {
        filesArray.push(file.filename)
      }
    }
    const { name, slug, company } = req.body
    const productObj = { name, slug, company, files: filesArray }
    const duplicate = await Product.findOne({ slug })
    if (duplicate)
      return duplicateResponse(res, "This product already exist!", "")
    const addedProduct = await Product.create(productObj)
    return createResponse(res, "Product added successfully!", addedProduct)
  } catch (error) {
    console.log(error)
    return errorResponse(
      res,
      "Something went wrong while adding the products!",
      ""
    )
  }
}

const updateProduct = async (req, res) => {
  try {
    const permissions = ["read", "create", "delete", "update"] // Define the required permissions
    const hasAllPermissions = permissions.every((requiredPermission) =>
      req.user.role.permission.some(
        (userPermission) => userPermission.value === requiredPermission
      )
    )
    if (!hasAllPermissions) {
      return unauthorizedResponse(
        res,
        "You are not authorized to update the product!",
        ""
      )
    }
    let filesArray = []
    if (req.files.length > 0) {
      for (const file of req.files) {
        filesArray.push(file.filename)
      }
    }

    const product = await Product.findByIdAndUpdate(req.params.id,{$set:{
      ...req.body
    }})
    if (!product) return notFoundResponse(res, "No product found!", "")
    product.files = [...product.files, ...filesArray]
    await product.save()
    return createResponse(res, "Product updated successfully!", updateProduct)
  } catch (error) {
    console.log(error)
    return errorResponse(
      res,
      "Something went wrong while updating the products!",
      ""
    )
  }
}

const deleteProduct = async (req, res) => {
  try {
    const permissions = ["read", "create", "delete", "update"] // Define the required permissions
    const hasAllPermissions = permissions.every((requiredPermission) =>
      req.user.role.permission.some(
        (userPermission) => userPermission.value === requiredPermission
      )
    )
    if (!hasAllPermissions) {
      return unauthorizedResponse(
        res,
        "You are not authorized to delete the product!",
        ""
      )
    }
    const deletedProduct = await Product.findByIdAndDelete({
      _id: req.params.id,
    })
    // console.log(deletedProduct);
    if (!deletedProduct)
      return notFoundResponse(res, "This product does not exists", "")
    return createResponse(res, "Product deleted successfully!", "")
  } catch (error) {
    console.log(error)
    return errorResponse(
      res,
      "Something went wrong while deleting the products!",
      ""
    )
  }
}

const getProduct = async (req, res) => {
  try {
    const permissions = ["read", "create", "delete", "update"] // Define the required permissions
    const hasAllPermissions = permissions.every((requiredPermission) =>
      req.user.role.permission.some(
        (userPermission) => userPermission.value === requiredPermission
      )
    )
    if (!hasAllPermissions) {
      return unauthorizedResponse(
        res,
        "You are not authorized to fetch the product!",
        ""
      )
    }
    const products = await Product.find({ company: req.user.company._id })
    // console.log(products.length);
    if (products.length <= 0)
      return notFoundResponse(res, "There is no products available!", "")
    return fetchResponse(res, "Product fetched successfully!", products)
  } catch (error) {
    console.log(error)
    return errorResponse(
      res,
      "Something went wrong while fetching the products!",
      ""
    )
  }
}
module.exports = {
  addProduct,
  deleteProduct,
  updateProduct,
  getProduct,
}
