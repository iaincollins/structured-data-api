var request = require("supertest-as-promised");
var app = require('../../server.js');

describe('Place API', function() {
  var place = {};
  
  it('should be able to create a place', function(done) {
    request(app)
    .post('/entity')
    .send({ type: "Place", name: "London", description: "An example place"})
    .expect(201)
    .then(function(res) {
      // Save new place for other tests below
      place = res.body;

      if (!place.id)
        return done(Error("A place should have an ID"));

      if (place.type != "Place")
        return done(Error("A place should be of type 'Place'"));

      if (place.name != "London")
        return done(Error("Should be able to give a place a name"));
      
      if (place.description != "An example place")
        return done(Error("Should be able to give a place a description"));

      done();
    });
  });

  it('should be able to retreive a place', function(done) {
    request(app)
    .get('/entity/'+place.id)
    .expect(200)
    .then(function(res) {
      if (!res.body.id)
        return done(Error("Should be able to get a place by ID"));
      done();
    });
  });

  it('should be able to update a place', function(done) {
    place.name = "LONDON, UK";
    request(app)
    .put('/entity/'+place.id)
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
    .delete('/entity/'+place.id)
    .expect(204)
    .then(function(res) {
      done();
    });
  });

  it('should not be able to retreive a place that has been deleted', function(done) {
    request(app)
    .get('/entity/'+place.id)
    .expect(404)
    .then(function(res) {
      if (res.body.id)
        return done(Error("Should not be able to get a place by ID once they have been deleted"));
      done();
    });
  });   
});
