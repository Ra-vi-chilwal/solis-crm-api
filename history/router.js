const Router = require("express").Router();
const { checkToken } = require("../middleware");
const { getLeadHistory } = require("./controller");
const router = require("express").Router();
router.get("/get/:leadId", checkToken, getLeadHistory);

module.exports = router;
