const { Role } = require("./model");
module.exports = {
  addRole: async (req, res) => {
    try {
      const userData = req.body;
      const existingUser = await Role.findOne({ slug: userData.slug, companyId: req.user.company._id });
      if (existingUser) {
        return res.status(200).json({
          code: 'DUPLICATION',
          message: 'Role  already exists.',
        });
      }
      const result = await Role.create(userData);
      res.status(200).json({
        code: 'SUCCESS',
        data: result,
      });
    } catch (error) {
      console.error('Error adding Role:', error);
      res.status(500).json({
        code: 'ERROR',
        message: 'An error occurred while adding the Role.',
      });
    }
  },

  //--------------------GET DEPARTMENT----------------------------------
  getRole: async (req, res) => {
    try {
      const hasRootPermission = req.user.role.permission.some(permission => permission.value === "root");
      if (hasRootPermission) {
        await Role.find({ companyId: req.user.company._id }).then((result, err) => {
          if (result) {
            return res.status(200).json({
              code: "FETCHED",
              data: result
            })
          }
          else {
            return res.status(400).json({
              code: "ERROR",
              data: err
            })
          }
        })
      } else {
        await Role.find({ companyId: req.user.company._id }).then((result, err) => {
          if (result) {
            return res.status(200).json({
              code: "FETCHED",
              data: result
            })
          }
          else {
            return res.status(400).json({
              code: "ERROR",
              data: err
            })
          }
        })
      }

    } catch (err) {
      console.log("err")
    }
  },
  deleteRole : async (req,res) =>{
    
  }

}
