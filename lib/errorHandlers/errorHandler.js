const { HttpStatus, HttpStatusResponse, ipAddress } = require('@1onlinesolution/dws-http');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = (error, req, res, next) => {
  const ip = ipAddress(req);
  let errorObject = isProduction ? undefined : error;

  if (error.status === HttpStatus.statusNotFound) {
    return res.json(HttpStatusResponse.notFound({ message: `${req.originalUrl} not found` }, errorObject, ip));
  }

  if (error.code && error.code === 'EBADCSRFTOKEN') {
    const message = 'CSRF token mismatch';
    return res.json(HttpStatusResponse.forbidden({ message: `${HttpStatus.statusNameForbidden} - ${message}` }, errorObject, ip));
  }

  return res.json(HttpStatusResponse.serverError({ message: `${HttpStatus.statusNameServerError}` }, errorObject, ip));
};
