var request = require("supertest-as-promised");
var app = require('../../server.js');

describe('Organization Schema', function() {
  var organization = {};
  
  it('should be able to create an organization', function(done) {
    request(app)
    .post('/api')
    .set('x-api-key', global.user.apiKey)
    .send({ type: "Organization", name: "ACME INC", description: "An example organization"})
    .expect(201)
    .then(function(res) {
      // Save new organization for other tests below
      organization = res.body;

      if (!organization.id)
        return done(Error("A organization should have an ID"));

      if (organization.type != "Organization")
        return done(Error("A organization should be of type 'Organization'"));

      if (organization.name != "ACME INC")
        return done(Error("Should be able to give an organization a name"));
      
      if (organization.description != "An example organization")
        return done(Error("Should be able to give an organization a description"));

      done();
    });
  });

  it('should be able to retrieve an organization', function(done) {
    request(app)
    .get('/api/'+organization.id)
    .expect(200)
    .then(function(res) {
      if (!res.body.id)
        return done(Error("Should be able to get an organization by ID"));
      done();
    });
  });

  it('should be able to update an organization', function(done) {
    organization.name = "ACME LIMITED";
    request(app)
    .put('/api/'+organization.id)
    .set('x-api-key', global.user.apiKey)
    .send(organization)
    .expect(200)
    .then(function(res) {
      if (res.body.name != "ACME LIMITED")
        return done(Error("Should be able to rename an organization"));
      done();
    });
  });
  
  it('should be able to delete an organization', function(done) {
    request(app)
    .delete('/api/'+organization.id)
    .set('x-api-key', global.user.apiKey)
    .expect(204)
    .then(function(res) {
      done();
    });
  });

  it('should not be able to retrieve an organization that has been deleted', function(done) {
    request(app)
    .get('/api/'+organization.id)
    .expect(404)
    .then(function(res) {
      if (res.body.id)
        return done(Error("Should not be able to get an organization by ID once they have been deleted"));
      done();
    });
  });   
});
