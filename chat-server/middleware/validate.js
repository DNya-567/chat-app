/**
 * VALIDATION MIDDLEWARE
 *
 * Usage in routes:
 * router.post("/register", validate(registerSchema), async (req, res) => {
 *   // req.body is now guaranteed to be valid
 * });
 *
 * For params validation:
 * router.get("/:id", validateParams(getUserByIdSchema), async (req, res) => {
 *   // req.params is now guaranteed to be valid
 * });
 */

/**
 * Validates req.body against a Joi schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Show all errors, not just first one
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const details = error.details.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return res.status(400).json({
        message: "Validation failed",
        errors: details,
      });
    }

    // Replace body with validated & sanitized data
    req.body = value;
    next();
  };
};

/**
 * Validates req.params against a Joi schema
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return res.status(400).json({
        message: "Validation failed",
        errors: details,
      });
    }

    // Replace params with validated & sanitized data
    req.params = value;
    next();
  };
};

/**
 * Validates req.query against a Joi schema
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return res.status(400).json({
        message: "Validation failed",
        errors: details,
      });
    }

    // Replace query with validated & sanitized data
    req.query = value;
    next();
  };
};

module.exports = {
  validate,
  validateParams,
  validateQuery,
};
