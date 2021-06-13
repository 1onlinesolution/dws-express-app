const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const hbs = require('express-handlebars');
const cors = require('cors');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const session = require('@1onlinesolution/dws-session/lib/session');
const flash = require('connect-flash');
const compression = require('compression');
const morgan = require('morgan');
const MongoStore = require('connect-mongo');
const { Validity } = require('@1onlinesolution/dws-utils');
const { Logger, consoleOptions, fileOptions, mongoOptions } = require('@1onlinesolution/dws-log');
const RouterInfo = require('./routerInfo');

const isProduction = process.env.NODE_ENV === 'production';
fileOptions.filename = path.resolve(__dirname, 'logs/errors.log');

class ExpressApplication {
  constructor({
    isApi = false,
    domain = undefined,
    appDirName = undefined, // when creating an app, set it to __dirname, to capture the app's specific directory
    useHelmet = false,
    useSession = false,
    useCookieParser = false,
    useCors = false,
    useFlash = false,
    useCompression = false,
    useCsurf = false,
    useBodyParser = false,
    useViewEngine = false,
    useLog = false,

    staticPathDir = '/public',
    cookieSecret = undefined,
    logMorganFormat = 'combine',

    errorNotFoundHandler = require('./errorHandlers/errorNotFoundHandler'),
    errorHandler = require('./errorHandlers/errorHandler'),

    helmetOptions = require('./options/helmet'),
    corsOptions = require('./options/cors'),
    csrfOptions = require('./options/csrf'),
    cookiesOptions = require('./options/cookies')(isProduction, domain),
    sessionOptions = require('./options/session'),
    bodyParserOptions = require('./options/bodyParser'),
    viewEngineOptions = require('./options/viewEngine'),
    logOptions = require('./options/log')(isProduction, consoleOptions, fileOptions, mongoOptions),
  }) {
    // =======================================================================
    // error checking
    if (!Validity.isValidString(domain)) throw new Error('invalid domain');
    if (useCsurf) {
      if (!csrfOptions) throw new Error('invalid CSRF options');
    }
    if (useCors) {
      if (!corsOptions) throw new Error('invalid CORS options');
    }
    if (useSession) {
      if (!sessionOptions) throw new Error('invalid session options');
      if (!Validity.isValidString(sessionOptions.secret)) throw new Error('invalid session secret');
      if (!Validity.isValidString(sessionOptions.mongoUrl)) throw new Error('invalid session MongoDB url');
      if (!Validity.isValidInteger(sessionOptions.ttl)) throw new Error('invalid session MongoDB ttl');
    }
    if (useCookieParser) {
      if (!Validity.isValidString(cookieSecret)) throw new Error('invalid cookie secret');
    }

    if (!appDirName || appDirName === '') throw new Error('invalid __dirname');

    if (useViewEngine && isApi) throw new Error('an API cannot use a view engine');

    if (useViewEngine) {
      if (!viewEngineOptions) throw new Error('invalid view engine options');
      if (!Validity.isValidString(viewEngineOptions.viewsDir)) throw new Error('invalid engine views directory');
      if (!Validity.isValidString(viewEngineOptions.layoutsDir)) throw new Error('invalid engine layouts directory');
      if (!Validity.isValidString(viewEngineOptions.partialsDir)) throw new Error('invalid engine partials directory');
    }

    if (useLog) {
      if (!logOptions) throw new Error('invalid log options');
      if (!Validity.isValidString(logOptions.level)) throw new Error('invalid log level');
      if (logOptions.useMongoDB) {
        if (!logOptions.mongoOptions) throw new Error('invalid MongoDB options for logger');
        if (!Validity.isValidString(logOptions.mongoOptions.db)) throw new Error('invalid MongoDB options for logger - db');
        if (!Validity.isValidString(logOptions.mongoOptions.collection)) throw new Error('invalid MongoDB options for logger - collection');
      }
      if (logOptions.useFile) {
        if (!logOptions.fileOptions) throw new Error('invalid file options for logger');
        if (!Validity.isValidString(logOptions.fileOptions.filename, 2)) throw new Error('invalid file options for logger - filename');
        if (!Validity.isValidString(logOptions.fileOptions.filename, 2)) throw new Error('invalid file options for logger - filename');
      }
    }

    // =======================================================================
    // assignment
    this.isApi = isApi;
    this.domain = domain;
    this.appDirName = appDirName;
    this.cookieSecret = cookieSecret;
    this.staticPathDir = staticPathDir;
    this.logMorganFormat = logMorganFormat;

    this.errorNotFoundHandler = errorNotFoundHandler;
    this.errorHandler = errorHandler;

    this.useHelmet = useHelmet;
    this.useBodyParser = useBodyParser;
    this.useSession = useSession;
    this.useCookieParser = useCookieParser;
    this.useCors = useCors;
    this.useCsurf = useCsurf;
    this.useFlash = !this.isApi && useFlash;
    this.useCompression = useCompression;
    this.useViewEngine = !this.isApi && useViewEngine;
    this.useLog = useLog;

    this.helmetOptions = this.useHelmet ? helmetOptions : null;
    this.corsOptions = this.useCors ? corsOptions : null;
    this.csrfOptions = this.useCsurf ? csrfOptions : null;
    this.cookiesOptions = this.useCookieParser ? cookiesOptions : null;
    this.sessionOptions = this.useSession ? createSessionOptionsForStore(sessionOptions) : null;
    this.bodyParserOptions = this.useBodyParser ? bodyParserOptions : null;
    this.viewEngineOptions = this.useViewEngine ? viewEngineOptions : null;
    this.logOptions = this.useLog ? logOptions : null;

    Object.freeze(this.helmetOptions);
    Object.freeze(this.corsOptions);
    Object.freeze(this.csrfOptions);
    Object.freeze(this.cookiesOptions);
    Object.freeze(this.sessionOptions);
    Object.freeze(this.viewEngineOptions);
    Object.freeze(this.logOptions);

    // =======================================================================
    // the express app
    this.app = express();

    // Middleware
    this.middleware = [];

    if (this.useHelmet) {
      // Contains HSTS also: https://helmetjs.github.io/
      this.app.use(helmet(this.helmetOptions));
    }

    if (this.useCors) {
      this.app.use(cors(this.corsOptions));
    }

    if (isProduction) {
      // Set trust proxy to true if your Node.js app is working behind reverse proxy such
      // as Varnish or Nginx. This will permit trusting in the X-Forwarded-* headers, such as
      // X-Forwarded-Proto (req.protocol) or X-Forwarder-For (req.ips). The trust proxy
      // setting is disabled by default.
      this.app.set('trust proxy', 1);

      // compress all responses in production
      if (this.useCompression) {
        this.app.use(compression());
      }
    }

    if (this.staticPathDir) {
      if (Validity.isValidString(this.staticPathDir)) {
        const staticPath = path.join(this.appDirName, this.staticPathDir);
        this.app.use(express.static(staticPath));
      } else if (Validity.isArray(this.staticPathDir)) {
        this.staticPathDir.forEach((item) => {
          const staticPath = path.join(this.appDirName, item);
          this.app.use(express.static(staticPath));
        });
      }
    }

    if (this.logger) {
      this.app.use(morgan(this.logMorganFormat, { stream: this.logger.stream }));
    }

    if (this.useViewEngine) {
      // view engine setup
      this.app.engine('hbs', hbs(this.viewEngineOptions));
      this.app.set('views', path.join(this.appDirName, this.viewEngineOptions.viewsDir));
      this.app.set('view engine', 'hbs');
    }

    if (this.useBodyParser) {
      if (this.bodyParserOptions.urlencoded) {
        const extended = this.bodyParserOptions.urlencodedExtended;
        const limit = this.bodyParserOptions.urlencodedLimit;
        if (limit) {
          this.app.use(bodyParser.urlencoded({ extended: extended, limit: limit }));
        } else {
          this.app.use(bodyParser.urlencoded({ extended: extended }));
        }
      }

      if (this.bodyParserOptions.json) {
        const limit = this.bodyParserOptions.jsonLimit;
        if (limit) this.app.use(bodyParser.json({ limit: limit }));
        else this.app.use(bodyParser.json());
      }
    }

    if (this.useCookieParser) {
      this.app.use(cookieParser(this.cookieSecret, this.cookiesOptions));
    }

    if (this.useSession) {
      this.app.use(session(this.sessionOptions));
    }

    if (this.useCsurf) {
      this.app.use(csrf(this.csrfOptions));
    }

    if (this.useFlash) {
      // DO NOT USE FLASH WITHOUT SESSION !!!
      // Flash requires a session, so once logged out you can't use it !!!
      this.app.use(flash());
    }

    // Routes
    this.routers = new Map();

    this.isListening = false;
    return this;
  }

  initializeApplication() {
    if (this.isListening) return;

    // Add middleware
    this.middleware.forEach((middleware) => {
      this.app.use(middleware);
    });

    // Add routers
    this.routers.forEach((routerInfo) => {
      if (!routerInfo.middleware) this.app.use(routerInfo.path, ...routerInfo.router);
      else this.app.use(routerInfo.path, ...routerInfo.middleware, routerInfo.router);
    });

    // Errors/NotFound
    if (this.errorNotFoundHandler) this.app.use(this.errorNotFoundHandler);
    if (this.errorHandler) this.app.use(this.errorHandler);
  }

  addRouter(path, middleware = []) {
    if (this.isListening) return;

    // A router object is an isolated instance of middleware and routes.
    // You can think of it as a “mini-application,”
    // capable only of performing middleware and routing functions.
    // Every Express application has a built-in app router.
    //
    // A router behaves like middleware itself,
    // so you can use it as an argument to app.use()
    // or as the argument to another router’s use() method.
    const routerInfo = new RouterInfo(path, express.Router(), this, middleware);
    this.routers.set(path, routerInfo);
    return routerInfo;
  }

  useErrorNotFoundHandler(middleware) {
    if (middleware) {
      this.errorNotFoundHandler = middleware;
    }
  }

  useErrorHandler(middleware) {
    if (middleware) {
      this.errorHandler = middleware;
    }
  }

  flash(req, mode, message) {
    // !!! NOTE: !!!
    // You must have a user session active for this to work !!!
    const { flash } = req;
    if (flash) flash(mode, message);
  }

  static get [Symbol.species]() {
    return this;
  }

  listen(port = 3000, callback) {
    if (!Validity.isValidNumber(+port, 1, 65535)) throw new Error('invalid port');

    if (!this.isListening) {
      this.initializeApplication();

      this.app.listen(port, () => {
        if (callback) callback();
      });

      this._isListening = true;
      Object.freeze(this.isListening);

      Object.freeze(this.middleware);
      Object.freeze(this.routers);
      Object.freeze(this.app);
    }
  }
}

module.exports = ExpressApplication;

function createSessionOptionsForStore(sessionOptions) {
  const options = (sessionOptions = {
    secret: sessionOptions.secret,
    store: MongoStore.create({
      mongoUrl: sessionOptions.mongoUrl,
      ttl: sessionOptions.ttl,
    }),
    resave: sessionOptions.resave,
    saveUninitialized: sessionOptions.saveUninitialized,
  });

  if (sessionOptions.name) options.name = sessionOptions.name;
  return options;
}
