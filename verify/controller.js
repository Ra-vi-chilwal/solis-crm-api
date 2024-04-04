const jwt = require("jsonwebtoken")
const {
  unauthorizedResponse,
  errorResponse,
  fetchResponse,
} = require("../utils/response")
require("dotenv").config()
module.exports = {
  verify: async (req, res) => {
    try {
      var token = req.body.token
      if (!token) {
        return unauthorizedResponse(
          res,
          "UNAUTORIZED",
          "Please provide a token!"
        )
      }
      var decodedJwt = jwt.decode(token, { complete: true })
      if (!decodedJwt) {
        return res.status(401).json({
          message: "Not a valid JWT token",
        })
      }
      const payload = await jwt.verify(token, process.env.TOKEN_KEY)
      return res.status(200).json({
        code: "FETCHED",
        body: {
          payload: payload,
          verify: true,
        },
      })
    } catch (err) {
      // console.log(err);
      return errorResponse(
        res,
        "Something went wrong while verifying token!",
        ""
      )
    }
  },
}
