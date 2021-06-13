const assert = require('assert');
const ExpressApplication = require('../lib/expressApplication');

describe('ExpressApplication', () => {
  it('Creates a basic app', () => {
    const app = new ExpressApplication({
      domain: 'my domain',
      appDirName: __dirname,
    });
    assert(typeof app === 'object');
    assert(app.isApi === false);
  });

  it('Creates a basic api', () => {
    const app = new ExpressApplication({
      isApi: true,
      domain: 'my domain',
      appDirName: __dirname,
    });
    assert(app.isApi === true);
  });

  it('Symbol.species', () => {
    const app = new ExpressApplication({
      domain: 'my domain',
      appDirName: __dirname,
    });
    assert(app instanceof ExpressApplication);
  });
});
