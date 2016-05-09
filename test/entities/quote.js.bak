var request = require("supertest-as-promised");
var app = require('../../server.js');

describe('Quote API', function() {
  var quote = {};
  
  it('should be able to create a quote', function(done) {
    request(app)
    .post('/entity')
    .send({ type: "Quote", name: "Famous speech", quotation: "An example quote"})
    .expect(201)
    .then(function(res) {
      // Save new quote for other tests below
      quote = res.body;
      if (!quote.id)
        return done(Error("A quote should have an ID"));

      if (quote.type != "Quote")
        return done(Error("A quote should be of type 'Quote'"));

      if (quote.name != "Famous speech")
        return done(Error("Should be able to give a quote a name"));
      
      if (quote.quotation != "An example quote")
        return done(Error("Should be able to give a quote a description"));

      done();
    });
  });

  it('should be able to retreive a quote', function(done) {
    request(app)
    .get('/entity/'+quote.id)
    .expect(200)
    .then(function(res) {
      if (!res.body.id)
        return done(Error("Should be able to get a quote by ID"));
      done();
    });
  });

  it('should be able to update a quote', function(done) {
    quote.name = "World famous speech";
    request(app)
    .put('/entity/'+quote.id)
    .send(quote)
    .expect(200)
    .then(function(res) {
      if (res.body.name != "World famous speech")
        return done(Error("Should be able to rename a quote"));
      done();
    });
  });
  
  it('should be able to delete a quote', function(done) {
    request(app)
    .delete('/entity/'+quote.id)
    .expect(204)
    .then(function(res) {
      done();
    });
  });

  it('should not be able to retreive a quote that has been deleted', function(done) {
    request(app)
    .get('/entity/'+quote.id)
    .expect(404)
    .then(function(res) {
      if (res.body.id)
        return done(Error("Should not be able to get a quote by ID once they have been deleted"));
      done();
    });
  });   
});
