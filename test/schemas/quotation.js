var request = require("supertest-as-promised");
var app = require('../../server.js');

describe('Quotation Schema', function() {
  var quote = {};
  
  it('should be able to create a quotation', function(done) {
    request(app)
    .post('/api')
    .send({ 
      type: "Quotation",
      name: "A well known quote",
      text: "You must be the change you wish to see in the world.",
      spokenByCharacter: {
        name: "Mahatma Gandhi",
        birthDate: "2000-01-01"
      }
    })
    .expect(201)
    .then(function(res) {
      // Save new quote for other tests below
      quote = res.body;
      if (!quote.id)
        return done(Error("A quotation should have an ID"));

      if (quote.type != "Quotation")
        return done(Error("A quotation should be of type 'Quote'"));

      if (quote.name != "A well known quote")
        return done(Error("Should be able to give a quotation a name"));
      
      if (quote.text != "You must be the change you wish to see in the world.")
        return done(Error("Should be able to add text to a quotation"));

      done();
    });
  });

  it('should be able to retrieve a quotation', function(done) {
    request(app)
    .get('/api/'+quote.id)
    .expect(200)
    .then(function(res) {
      if (!res.body.id)
        return done(Error("Should be able to get a quotation by ID"));
      done();
    });
  });

  it('should be able to update a quotation', function(done) {
    quote.text = "Taste the rainbow";
    quote.spokenByCharacter = {
      name: "Skittles (Wrigley Company)",
      leiCode: "549300MGWYJ9LR7XYV24"
    };
    request(app)
    .put('/api/'+quote.id)
    .send(quote)
    .expect(200)
    .then(function(res) {
      request(app)
      .get('/api/'+quote.id)
      .expect(200)
      .then(function(res) {
        if (res.body.text != "Taste the rainbow")
          return done(Error("Should be able to modify a quotation and the change should be saved"));
        
        if (res.body.spokenByCharacter.leiCode != "549300MGWYJ9LR7XYV24")
          return done(Error("Should be able to modify a quotation to reference an Organization"));
        done();
      });
    });
  });
  
  
  /**
   * Skipped as not implemented in the reference schema.
   */
  it.skip('should be able to use an ObjectID to refer to a Person or Organization', function(done) {
    quote.spokenByCharacter = "57348428372a5abaaf3e1f2b";
    request(app)
    .put('/api/'+quote.id)
    .send(quote)
    .expect(200)
    .then(function(res) {
      request(app)
      .get('/api/'+quote.id)
      .expect(200)
      .then(function(res) {
        if (res.body.spokenByCharacter != "57348428372a5abaaf3e1f2b")
          return done(Error("Should be able to modify a quotation to use a reference of an ObjectID of a Person or Organization"));
        
        done();
      });
    });
  });
  
  /**
   * This is skipped as it is not implemented in the reference schema.
   */
  it.skip('should not store an ObjectID for a Person or Organization as a string', function(done) {
    quote.spokenByCharacter = "abc123";
    request(app)
    .put('/api/'+quote.id)
    .send(quote)
    .then(function(res) {
      
      if (res.statusCode == "200")
        return done(Error("Should not allow an invalid ObjectID as a reference for a Person or Organization"));

      request(app)
      .get('/api/'+quote.id)
      .expect(200)
      .then(function(res) {
        if (res.body.spokenByCharacter == "abc123")
          return done(Error("An ObjectID of a Person or Organization but should not be treated like a string"));
        
        done();
      });
    });
  });
  
  it('should be able to delete a quotation', function(done) {
    request(app)
    .delete('/api/'+quote.id)
    .expect(204)
    .then(function(res) {
      done();
    });
  });

  it('should not be able to retrieve a quotation that has been deleted', function(done) {
    request(app)
    .get('/api/'+quote.id)
    .expect(404)
    .then(function(res) {
      if (res.body.id)
        return done(Error("Should not be able to get a quotation by ID once they have been deleted"));
      done();
    });
  });   
});
