const { body } = require('express-validator');

// Validation rules for the user schema with custom error messages
const userValidationRules = () => {
  return [
    body('firstName')
      .isString()
      .withMessage('First name must be a string')
      .notEmpty()
      .withMessage('First name is required'),
    body('lastName')
      .isString()
      .withMessage('Last name must be a string')
      .notEmpty()
      .withMessage('Last name is required'),
    body('password')
      .isString()
      .withMessage('Password must be a string')
      .notEmpty()
      .withMessage('Password is required'),
    body('email')
      .isEmail()
      .withMessage('Invalid email address'),
    body('role')
      .isMongoId()
      .withMessage('Role must be a valid MongoDB ID')
      .notEmpty()
      .withMessage('Role is required'),
    body('gender')
      .isString()
      .withMessage('Gender must be a string')
      .notEmpty()
      .withMessage('Gender is required'),
    body('company')
      .isMongoId()
      .withMessage('Company must be a valid MongoDB ID')
      .notEmpty()
      .withMessage('Company is required')
  ];
};

module.exports = {
  userValidationRules,
};
