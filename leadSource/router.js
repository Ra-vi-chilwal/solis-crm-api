const { checkToken } = require("../middleware");
const { exchangeToken } = require("../utils/exchangeFbToken");
const {
  acceptLead,
  generateLead,
  reasonForRejectionStatus,
  rejectLead,
  updateLeadInfo,
  getManualLeads,
  getLeadByLeadId,
  fetchFbCampaign,
  fetchLeadsForCampaign,
  trashLeads, 
  deleteLeads,
  assignMultipleLeads
} = require("./controller");
const leadRouter = require("express").Router();
leadRouter.post("/update/status", checkToken, reasonForRejectionStatus);
leadRouter.post("/add", checkToken, generateLead);
leadRouter.get("/get", checkToken, getManualLeads);
leadRouter.post("/accept", checkToken, acceptLead);
leadRouter.post("/reject", checkToken, rejectLead);
leadRouter.put("/update/info/:leadId", checkToken, updateLeadInfo);
leadRouter.get("/get/leadbyid/:leadId", checkToken, getLeadByLeadId);
leadRouter.get("/fetch/campaign", checkToken, fetchFbCampaign);
leadRouter.post("/fetch/campaign/leads", checkToken, fetchLeadsForCampaign);
leadRouter.post("/trash/:leadId", checkToken, trashLeads);
leadRouter.get("/exchange/fbtoken", checkToken, exchangeToken);
leadRouter.delete("/leads/delete",checkToken,deleteLeads)
leadRouter.post("/leads/assign/multiple",checkToken,assignMultipleLeads)

module.exports = leadRouter;