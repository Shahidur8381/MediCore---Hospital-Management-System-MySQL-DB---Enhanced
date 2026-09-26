const { ZodError } = require('zod');

/**
 * Universal Zod validation middleware factory for Express.
 * Validates request body, query params, and route params.
 * Returns structured, consistent HTTP 400 responses without leaking internal errors.
 */
const validate = (schemas) => {
  return async (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError || error.name === 'ZodError') {
        const issues = error.issues || error.errors || [];
        const formattedErrors = issues.map((err) => ({
          field: Array.isArray(err.path) ? err.path.join('.') : String(err.path || 'root'),
          message: err.message,
          rule: err.code
        }));

        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: formattedErrors
        });
      }

      return res.status(400).json({
        status: 'error',
        message: 'Invalid request data'
      });
    }
  };
};

module.exports = validate;
