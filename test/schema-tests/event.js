var request = require("supertest-as-promised");
var app = require('../../server.js');

describe('Event Schema', function() {
  var event = {},
      relativePath = '';

  it('should be able to create an event', function(done) {
    request(app)
    .post('/Event')
    .set('x-api-key', global.user.apiKey)
    .send({ name: "The Big Bang", description: "In the beginning" })
    .then(function(res) {
      // Save new event for other tests below
      event = res.body;
      relativePath = res.body['@id'].replace("http://localhost:3000",'');
      
      if (!event['@id'])
        return done(Error("An event should have an ID"));

      if (!event['@type'])
        return done(Error("An event should have a type"));

      if (event.name != "The Big Bang")
        return done(Error("Should be able to give an event a name"));
      
      if (event.description != "In the beginning")
        return done(Error("Should be able to give an event a description"));

      done();
    });
  });

  it('should be able to retrieve an event', function(done) {
    request(app)
    .get(relativePath)
    .expect(200)
    .then(function(res) {
      if (!res.body['@id'])
        return done(Error("Should be able to get an event by ID"));
      done();
    });
  });

  it('should be able to update an event', function(done) {
    event.name = "In the Beginning";
    request(app)
    .put(relativePath)
    .set('x-api-key', global.user.apiKey)
    .send(event)
    .expect(200)
    .then(function(res) {
      if (res.body.name != "In the Beginning")
        return done(Error("Should be able to rename an event"));
      done();
    });
  });
  
  it('should be able to delete an event', function(done) {
    request(app)
    .delete(relativePath)
    .set('x-api-key', global.user.apiKey)
    .expect(204)
    .then(function(res) {
      done();
    });
  });

  it('should not be able to retrieve an event that has been deleted', function(done) {
    request(app)
    .get(relativePath)
    .set('x-api-key', global.user.apiKey)
    .expect(404)
    .then(function(res) {
      if (res.body['@id'])
        return done(Error("Should not be able to get an event by ID once it has been deleted"));
      done();
    });
  });
});
