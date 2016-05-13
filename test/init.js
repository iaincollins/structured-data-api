var request = require("supertest-as-promised");
var app = require('../server.js');

before(function(done) {
  this.timeout(1000 * 10);
  
  /**
   * This checks looks to see if routes are loaded and ready to go before the
   * tests start, otherwise there is a chance that routes defined with 
   * express.Router() won't be ready and loaded.
   */
  var readyCheck = setInterval(function() {
    var route, routes = [];
    app._router.stack.forEach(function(middleware) {
      if (middleware.route) {
        routes.push(middleware.route);
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach(function(handler) {
          route = handler.route;
          route && routes.push(route);
        });
      }
    });
  
    if (routes.length > 1) {
      clearInterval(readyCheck);
      done();
    }
  },100);

});
