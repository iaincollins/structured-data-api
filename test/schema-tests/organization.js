var request = require("supertest-as-promised");
var app = require('../../server.js');

describe('Organization Schema', function() {
  var organization = {},
      relativePath = '';
  
  it('should be able to create an organization', function(done) {
    request(app)
    .post('/Organization')
    .set('x-api-key', global.user.apiKey)
    .send({ name: "ACME INC", description: "An example organization"})
    .expect(201)
    .then(function(res) {
      // Save new organization for other tests below
      organization = res.body;
      relativePath = res.body['@id'].replace("http://localhost:3000",'');

      if (!organization['@id'])
        return done(Error("An organization should have an ID"));

      if (!organization['@type'])
        return done(Error("An organization should have a type"));

      if (organization.name != "ACME INC")
        return done(Error("Should be able to give an organization a name"));
      
      if (organization.description != "An example organization")
        return done(Error("Should be able to give an organization a description"));

      done();
    });
  });

  it('should be able to retrieve an organization', function(done) {
    request(app)
    .get(relativePath)
    .expect(200)
    .then(function(res) {
      if (!res.body['@id'])
        return done(Error("Should be able to get an organization by ID"));
      done();
    });
  });

  it('should be able to update an organization', function(done) {
    organization.name = "ACME LIMITED";
    request(app)
    .put(relativePath)
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
    .delete(relativePath)
    .set('x-api-key', global.user.apiKey)
    .expect(204)
    .then(function(res) {
      done();
    });
  });

  it('should not be able to retrieve an organization that has been deleted', function(done) {
    request(app)
    .get(relativePath)
    .expect(404)
    .then(function(res) {
      if (res.body['@id'])
        return done(Error("Should not be able to get an organization by ID once it has been deleted"));
      done();
    });
  });   
});
