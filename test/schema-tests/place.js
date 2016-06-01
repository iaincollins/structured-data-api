var request = require("supertest-as-promised");
var app = require('../../server.js');

describe('Place Schema', function() {
  var place = {},
      relativePath = '';
  
  it('should be able to create a place', function(done) {
    request(app)
    .post('/Place')
    .set('x-api-key', global.user.apiKey)
    .send({ name: "London", description: "An example place"})
    .expect(201)
    .then(function(res) {
      // Save new place for other tests below
      place = res.body;
      relativePath = res.body['@id'].replace("http://localhost:3000",'');

      if (!place['@id'])
        return done(Error("A place should have an ID"));

      if (!place['@type'])
        return done(Error("A place should have a type"));
      
      if (place.name != "London")
        return done(Error("Should be able to give a place a name"));
      
      if (place.description != "An example place")
        return done(Error("Should be able to give a place a description"));

      done();
    });
  });

  it('should be able to retrieve a place', function(done) {
    request(app)
    .get(relativePath)
    .expect(200)
    .then(function(res) {
      if (!res.body['@id'])
        return done(Error("Should be able to get a place by ID"));
      done();
    });
  });

  it('should be able to update a place', function(done) {
    place.name = "LONDON, UK";
    request(app)
    .put(relativePath)
    .set('x-api-key', global.user.apiKey)
    .send(place)
    .expect(200)
    .then(function(res) {
      if (res.body.name != "LONDON, UK")
        return done(Error("Should be able to rename a place"));
      done();
    });
  });
  
  it('should be able to delete a place', function(done) {
    request(app)
    .delete(relativePath)
    .set('x-api-key', global.user.apiKey)
    .expect(204)
    .then(function(res) {
      done();
    });
  });

  it('should not be able to retrieve a place that has been deleted', function(done) {
    request(app)
    .get(relativePath)
    .expect(404)
    .then(function(res) {
      if (res.body['@id'])
        return done(Error("Should not be able to get a place by ID once it has been deleted"));
      done();
    });
  });   
});
