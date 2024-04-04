const { addRole, getRole,deleteRole } = require("./controller");
const { checkToken} = require('../middleware');
const RoleRouter = require("express").Router();
RoleRouter.post("/add",checkToken, addRole);
RoleRouter.get("/get",checkToken, getRole);
RoleRouter.delete("/delete",checkToken, deleteRole);
module.exports = RoleRouter;