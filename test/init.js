var request = require("supertest-as-promised"),
    app = require('../server'),
    User = require('../models/User');
  
global.user = {};
    
before(function(done) {
  this.timeout(1000 * 10);
  
  var readyCheckInterval;
  
  /**
   * Create an API Key to use in tests
   * Starts by removing any previous instance of the test account in case
   * there is one left over from a previous failed test run.
   */
  User.findOneAndRemove({ email: "api-key-test@example.com" }, function(err) {
    var user = new User({ email: "api-key-test@example.com" });
    user.role = "USER";
    user.save(function(err) {
      if (err)
        return done(new Error(err));
      global.user = user;
      readyCheckInterval = setInterval(readyCheck,100);
    });
  });
  
  /**
   * This checks looks to see if routes are loaded and ready to go before the
   * tests start, otherwise there is a chance that routes defined with 
   * express.Router() won't be ready and loaded.
   */
  var readyCheck = function() {
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
      clearInterval(readyCheckInterval);
      done();
    }
  }

});


/**
 * Cleanup after all tests are complete
 */
after(function(done) {
  User.findOneAndRemove({ _id: global.user._id }, function() { done(); });
});

