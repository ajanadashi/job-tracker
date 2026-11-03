// Domain errors. The api layer decides how they map to HTTP responses.
class ValidationError extends Error {
  constructor(details) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.details = details;
  }
}

class NotFoundError extends Error {
  constructor(resource) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

module.exports = { ValidationError, NotFoundError };
