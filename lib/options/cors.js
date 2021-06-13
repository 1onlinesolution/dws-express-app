module.exports = {
  // Configures the Access-Control-Allow-Origin CORS header
  origin: '*',

  // Configures the Access-Control-Allow-Methods CORS header
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',

  // Pass the CORS preflight response to the next handler.
  preflightContinue: false,

  // Provides a status code to use for successful OPTIONS requests,
  // since some legacy browsers (IE11, various SmartTVs) choke on 204.
  optionsSuccessStatus: 204,

  // Configures the Access-Control-Allow-Headers CORS header
  // Expects a comma-delimited string (ex: 'Content-Type,Authorization')
  // or an array (ex: ['Content-Type', 'Authorization']).
  // If not specified, defaults to reflecting the headers
  // specified in the request's Access-Control-Request-Headers header.
  // allowedHeaders: ['Content-Type', 'Authorization'],

  // Configures the Access-Control-Allow-Credentials CORS header.
  // Set to true to pass the header, otherwise it is omitted.
  // credentials: false,

  // Configures the Access-Control-Max-Age CORS header.
  // Set to an integer to pass the header, otherwise it is omitted.
  // maxAge: 100,
};