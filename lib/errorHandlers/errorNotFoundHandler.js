const HttpStatus = require('@1onlinesolution/dws-http/lib/httpStatus');

module.exports = (req, res, next) => {
  const error = new Error('Not Found');
  error.status = HttpStatus.statusNotFound;
  next(error);
};
