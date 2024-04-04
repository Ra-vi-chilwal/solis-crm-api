const { verify } = require("jsonwebtoken")
const { Users } = require("./Auth/model")
const { Role } = require("./role/model")
const util = require("util")
const verifyPromise = util.promisify(verify)
const NodeCache = require("node-cache")
const myCache = new NodeCache()

module.exports = {
  checkToken: async (req, res, next) => {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    try {
      if (!token) {
        return res.status(401).json({ code: "UNAUTHORIZED" })
      }
      // Retrieve data from the cache
      const cachedValue = myCache.get("userData")
      // console.log(cachedValue);
      // Check if data exists in the cache
      if (myCache.has("userData") && cachedValue.token == token) {
        // console.log("Cached Value:", cachedValue);

        req.user = cachedValue
        next()
      } else {
        console.log("no cached")
        const decoded = await verifyPromise(token, process.env.TOKEN_KEY)
        // console.log(decoded);
        const [user, roleData] = await Promise.all([
          Users.findById(decoded._id).populate({
            path: "company",
            populate: {
              path: "plan",
              model: "plan",
            },
          }),
          Role.findById(decoded.role).exec(),
        ])
        if (!user) {
          return res.status(404).json({ code: "USERNOTFOUND" })
        }
        const currentDate = new Date().toISOString().substring(0, 10)
        // const expiredOn = user.company && user.company.expireOn;
        // if (expiredOn <= currentDate) {
        //   return res.status(403).json({
        //     code: "PLANEXPIRED",
        //     body: {
        //       token: token,
        //       verified: true,
        //     },
        //   });
        // }
        user.role = roleData
        user.token = token
        req.user = user
        req.roleData = roleData
        myCache.set("userData", req.user, 7200) // Cach"message": "Internal server error"e data for 2 hour (7200 seconds)
        next()
      }
    } catch (error) {
      // console.error(error);
      return res.status(500).json({
        code: "SERVERERROR",
        error: error.message,
      })
    }
  },

  // superAdmin: async (req, res, next) => {
  //   try {
  //     const roles = await Role.findById({ _id: req.user.role._id });
  //     if (roles.slug == "superadmin" && roles.permissions && roles.permissions.some((item) => item.value == "root")) {
  //       next();
  //     }
  //     else {
  //       return res.status(401).json({
  //         code: "UNAUTHORIZED",
  //         data: 'You are not superadmin !!'
  //       });
  //     }
  //   } catch (error) {
  //     return res.status(401).json({
  //       code: "ERROROCCURED",
  //       data: error
  //     });
  //   }
  // },

  // delete
  // checkDelete: (req, res, next) => {
  //   const roleData = req.roleData;
  //   if (
  //     roleData &&
  //     roleData.permissions && roleData.permissions.some((element) => element.value === "delete")
  //   ) {
  //     next();
  //   } else {

  //     return res.status(200).json({ message: "You do not have permission for delete" })

  //   }
  // },
  // checkUpdate: (req, res, next) => {
  //   const roleData = req.roleData;
  //   if (roleData &&
  //     roleData.permissions && roleData.permissions.some((element) => element.value === "update")
  //   ) {
  //     next();
  //   } else {
  //     return res
  //       .status(200)
  //       .json({ message: "You do not have permission for update" })
  //       .end();
  //   }
  // },
  // checkCreate: (req, res, next) => {
  //   const roleData = req.roleData;
  //   if (
  //     roleData &&
  //     roleData.permissions && roleData.permissions.some((element) => element.value === "create")
  //   ) {
  //     next();
  //   } else {
  //     return res
  //       .status(200)
  //       .json({ message: "You do not have permission for create" })
  //       .end();
  //   }
  // },
  // checkRead: (req, res, next) => {
  //   const roleData = req.roleData;
  //   if (
  //     roleData &&
  //     roleData.permissions && roleData.permissions.some((element) => element.value === "read")
  //   ) {
  //     next();
  //   } else {
  //     return res
  //       .status(200)
  //       .json({ message: "You do not have permission for read." })
  //       .end();
  //   }
  // },
}
