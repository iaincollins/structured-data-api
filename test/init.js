var request = require("supertest-as-promised");
var app = require('../server.js');

/**
 * This is a hack to add a short delay before running the tests.
 * The Express routes don't seem to be ready right away and I can't
 * find a suitable event to bind to that is fired when they are.
 */
before(function(done) {
  this.timeout(1000 * 10);
  setTimeout(function() {
    done();
  },1000);
});
