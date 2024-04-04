const { body } = require("express-validator");

// Custom validation function for MM-DD-YYYY date format and future dates
const isValidDate = (value) => {
  // Regular expression to match MM-DD-YYYY or MM/DD/YYYY
  const dateRegex = /^(\d{2})[-/](\d{2})[-/](\d{4})$/;

  if (!dateRegex.test(value)) {
    return false;
  }

  const [, month, day, year] = value.match(dateRegex).map(Number);
  const currentDate = new Date();
  const inputDate = new Date(year, month - 1, day); // Months are 0-indexed

  return inputDate >= currentDate;
};

const leadFollowUpValidation = [
  body("subject").isIn(["call", "meeting"]).withMessage("Invalid subject"),
  body("leadId").isMongoId().withMessage("Invalid leadId"),
  body("targetTime").notEmpty().withMessage("targetTime is required"),
  body("targetDate")
    .notEmpty()
    .withMessage("targetDate is required")
    .custom(isValidDate)
    .withMessage("Invalid targetDate format or past date"),
  body("purpose").notEmpty().withMessage("purpose is required"),
  body("location").optional().isString(), // Optional field
  body("notes").optional().isString(), // Optional field
  body("isCompleted").optional().isBoolean(), // Optional field
  body("completionTime").optional().isString(), // Optional field
  body("completionDate").optional().isString(), // Optional field
];

module.exports = leadFollowUpValidation;
