module.exports = {
  // Determines if the token secret for the user should be stored in a cookie or in req.session.
  // Storing the token secret in a cookie implements the double submit cookie pattern. Defaults to false.
  cookie: false,

  // An array of the methods for which CSRF token checking will disabled.
  // Defaults to ['GET', 'HEAD', 'OPTIONS'].
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],

  // Determines what property ("key") on req the session object is located.
  // Defaults to 'session' (i.e. looks at req.session).
  // The CSRF secret from this library is stored and read as req[sessionKey].csrfSecret.
  // If the 'cookie' option is not false, then this option does nothing.
  sessionKey: 'session',

  // Provide a function that the middleware will invoke to read the token from the request for validation.
  // The function is called as value(req) and is expected to return the token as a string.
  value: undefined,
};