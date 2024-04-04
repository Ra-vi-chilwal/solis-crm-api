
const Router = require("express").Router()
const { checkToken } = require("../middleware")
const {
  usersLeadData,
  todaysLead,
  penVsAccVsRej,
  leadSourceData,
  tickerAPIReminderCall,
  getAllUnassignedLeads,
  getAllAssignedLeads,
  getPipelineLead,
  getMeetings,
  getTotalLeads,
  getClosedLeads,
  leadTypeData,
  allLeadCount,
  monthwiseLeads
} = require("./controller")
Router.get("/get/userslead/data", checkToken, usersLeadData)
Router.get("/get/todayleads", checkToken, todaysLead)
Router.get("/get/piechart", checkToken, penVsAccVsRej)
Router.get("/get/leadsource", checkToken, leadSourceData)
Router.get("/get/ticker", checkToken, tickerAPIReminderCall)
Router.get("/unassigned", checkToken, getAllUnassignedLeads)
Router.get("/assigned", checkToken, getAllAssignedLeads)
Router.get("/meeting", checkToken, getMeetings)
Router.get("/get/leadtype", checkToken, leadTypeData);
Router.get("/total/leads", checkToken, getTotalLeads)
Router.get("/closed/leads", checkToken, getClosedLeads)
Router.get("/pipeline/leads", checkToken, getPipelineLead);
Router.get("/pipeline/leads", checkToken, getPipelineLead);
Router.get("/count/allLeads", checkToken, allLeadCount);
Router.get("/count/monthwiseLeads", checkToken, monthwiseLeads);


module.exports = Router
