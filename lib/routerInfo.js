class RouterInfo {
  constructor(path, router, app, middleware = []) {
    if (!path) throw new Error('invalid path');
    if (!router) throw new Error('invalid router');
    if (!app) throw new Error('invalid app');

    this.path = path;
    this.router = router;
    this.middleware = middleware;
    this.app = app;
    return this;
  }
}

module.exports = RouterInfo;