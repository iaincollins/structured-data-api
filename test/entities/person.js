var request = require("supertest-as-promised");
var app = require('../../server.js');

describe('Person API', function() {
  var person = {};
  
  it('should be able to create a person', function(done) {
    request(app)
    .post('/entity')
    .send({ 
      type: "Person",
      name: "John Smith",
      description: "An example person",
      email: "john.smith@example.com",
      invalidPropertyName: "abcdef"
    })
    .expect(201)
    .then(function(res) {
      // Save new person for other tests below
      person = res.body;

      if (!person.id)
        return done(Error("A person should have an ID"));

      if (person.type != "Person")
        return done(Error("A person should be of type 'Person'"));

      if (person.name != "John Smith")
        return done(Error("Should be able to give a person a name"));
      
      if (person.description != "An example person")
        return done(Error("Should be able to give a person a description"));

      if (person.email != "john.smith@example.com")
        return done(Error("Should be able to give a person an email address"));

      if (person.invalidPropertyName)
        return done(Error("Should not be able to set an invalid property on a person"));

      done();
    });
  });

  it('should be able to retrieve a person', function(done) {
    request(app)
    .get('/entity/'+person.id)
    .expect(200)
    .then(function(res) {
      if (!res.body.id)
        return done(Error("Should be able to get a person by ID"));
      done();
    });
  });
  
  it('should be able to search for a person by name', function(done) {
    request(app)
    .get('/entity/search?name=John+Smith')
    .expect(200)
    .then(function(res) {
      if (res.body.length < 1)
        return done(Error("Should be able to search for a person by name"));
      done();
    });
  });

  it('should be able to search for a person by type', function(done) {
    request(app)
    .get('/entity/search?type=Person')
    .expect(200)
    .then(function(res) {
      if (res.body.length < 1)
        return done(Error("Should be able to search for a person by type"));
      done();
    });
  });
  
  it('should be able to update a person', function(done) {
    person.name = "Jane Smith";
    person.email = "jane.smith@example.com";
    request(app)
    .put('/entity/'+person.id)
    .send(person)
    .expect(200)
    .then(function(res) {
      // Look up the person again to see that the changes were saved
      request(app)
      .get('/entity/'+person.id)
      .expect(200)
      .then(function(res) {
        if (res.body.id != person.id)
          return done(Error("Should be able to update a person and the ID should not change"));

        if (res.body.name != "Jane Smith")
          return done(Error("Should be able to rename a person and the change should be saved"));
    
        if (res.body.email != "jane.smith@example.com")
          return done(Error("Should be able to update the email address for a person and the change shold be saved"));
        done();
      });
    });
  });
  
  it('should be able to delete keys from a person', function(done) {
    
    delete person.description;
    delete person.email;
    
    request(app)
    .put('/entity/'+person.id)
    .send(person)
    .expect(200)
    .then(function(res) {
      // Look up the person again to see that the changes were saved
      request(app)
      .get('/entity/'+person.id)
      .expect(200)
      .then(function(res) {
        if (res.body.description)
          return done(Error("Should be able to remove a description from a person"));
        if (res.body.email)
          return done(Error("Should be able to remove an email address from a person"));
        done();
      });
    });
  });


  it('should be able to delete a person', function(done) {
    request(app)
    .delete('/entity/'+person.id)
    .expect(204)
    .then(function(res) {
      done();
    });
  });

  it('should not be able to retrieve a person that has been deleted', function(done) {
    request(app)
    .get('/entity/'+person.id)
    .expect(404)
    .then(function(res) {
      if (res.body.id)
        return done(Error("Should not be able to get a person by ID once they have been deleted"));
      done();
    });
  });
  
  it('should get 400 malformed error for an invalid object ID', function(done) {
    request(app)
    .get('/entity/abc123')
    .expect(400)
    .then(function(res) {
      done();
    });
  });
});
