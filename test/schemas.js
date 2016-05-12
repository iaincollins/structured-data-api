var request = require("supertest-as-promised");
var app = require('../server.js');

describe('Fetch schemas', function() {
  it('should be able to retrieve a list of schemas', function(done) {
    request(app)
    .get('/api/schemas')
    .expect(200)
    .then(function(res) {
     if (!res.body.schemas)
       return done(Error("Should return a list of schemas"));
      done();
    });
  });
  
  it('should be able to retrieve a schema for a Person', function(done) {
    request(app)
    .get('/api/schema/Person')
    .expect(200)
    .then(function(res) {
      if (res.body.title != "Person Schema")
        return done(Error("Should be able to fetch a schema for a person"));
      done();
    });
  });
  
  it('should get a 404 response when requesting a schema that doesn\'t exist', function(done) {
    request(app)
    .get('/api/schema/SchemaThatDoesNotExist')
    .expect(404)
    .then(function(res) {
      done();
    });
  });
});