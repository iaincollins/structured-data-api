var request = require("supertest-as-promised");
var app = require('../../server.js');

describe('Event API', function() {
  var event = {};
  
  it('should be able to create an event', function(done) {
    request(app)
    .post('/entity')
    .send({ type: "Event", name: "The Big Bang", description: "An example event"})
    .expect(201)
    .then(function(res) {
      // Save new event for other tests below
      event = res.body;

      if (!event.id)
        return done(Error("An event should have an ID"));

      if (event.type != "Event")
        return done(Error("An event should be of type 'Event'"));

      if (event.name != "The Big Bang")
        return done(Error("Should be able to give an event a name"));
      
      if (event.description != "An example event")
        return done(Error("Should be able to give an event a description"));

      done();
    });
  });

  it('should be able to retreive an event', function(done) {
    request(app)
    .get('/entity/'+event.id)
    .expect(200)
    .then(function(res) {
      if (!res.body.id)
        return done(Error("Should be able to get an event by ID"));
      done();
    });
  });

  it('should be able to update an event', function(done) {
    event.name = "In the Beginning";
    request(app)
    .put('/entity/'+event.id)
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
    .delete('/entity/'+event.id)
    .expect(204)
    .then(function(res) {
      done();
    });
  });

  it('should not be able to retreive an event that has been deleted', function(done) {
    request(app)
    .get('/entity/'+event.id)
    .expect(404)
    .then(function(res) {
      if (res.body.id)
        return done(Error("Should not be able to get an event by ID once they have been deleted"));
      done();
    });
  });   
});
