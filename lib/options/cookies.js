module.exports = (isProduction, domain) => {
  return {
    // Specifies the boolean value for the Secure Set-Cookie attribute.
    // When truthy, the Secure attribute is set, otherwise it is not.
    // By default, the Secure attribute is not set.
    //
    // If you set the httpOnly flag on the cookie,
    // then all scripts running on the page are blocked
    // from accessing that cookie.
    secure: isProduction, // set the cookie only to be served with HTTPS

    // Specifies the boolean value for the HttpOnly Set-Cookie attribute.
    // When truthy, the HttpOnly attribute is set, otherwise it is not.
    // By default, the HttpOnly attribute is not set.
    //
    // NOTE: be careful when setting this to true,
    // as compliant clients will not allow client-side JavaScript to see the cookie in document.cookie
    httpOnly: true, // Mitigate XSS

    // Specifies the value for the Domain Set-Cookie attribute.
    // By default, no domain is set, and most clients will consider the cookie to apply to only the current domain.
    domain: isProduction ? domain : 'localhost', // i.e., limit the cookie exposure

    // Specifies the number (in seconds) to be the value for the Max-Age Set-Cookie attribute.
    // The given number will be converted to an integer by rounding down.
    // By default, no maximum age is set.
    //
    // NOTE: the cookie storage model specification states that if both expires and maxAge are set,
    // then maxAge takes precedence, but it is possible not all clients by obey this, so if both are set,
    // they should point to the same date and time.
    //
    // The following sets the cookie for 80 days (= 60 * 60 * 24 * 80 = 6912000 sec)
    maxAge: 60 * 60 * 24 * 80,
    // maxAge: 7200000,

    // Specifies the boolean or string to be the value for the SameSite Set-Cookie attribute.
    // true will set the SameSite attribute to Strict for strict same site enforcement.
    // false will not set the SameSite attribute.
    // 'lax' will set the SameSite attribute to Lax for lax same site enforcement.
    // 'none' will set the SameSite attribute to None for an explicit cross-site cookie.
    // 'strict' will set the SameSite attribute to Strict for strict same site enforcement.
    //
    // More information about the different enforcement levels can be found in the specification:
    // https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-03#section-4.1.2.7
    sameSite: true,
  };
};