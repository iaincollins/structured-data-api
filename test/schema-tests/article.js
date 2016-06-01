var request = require("supertest-as-promised");
var app = require('../../server.js');

describe('Article Schema', function() {
  var article = {},
      relativePath = '';

  it('should be able to create an article', function(done) {
    request(app)
    .post('/Article')
    .set('x-api-key', global.user.apiKey)
    .send({ name: "Breaking News", description: "This just in…" })
    .then(function(res) {
      // Save new article for other tests below
      article = res.body;
      relativePath = res.body['@id'].replace("http://localhost:3000",'');
  
      if (!article['@id'])
        return done(Error("An article should have an ID"));

      if (article.name != "Breaking News")
        return done(Error("Should be able to give an article a name"));
      
      if (article.description != "This just in…")
        return done(Error("Should be able to give an article a description"));
      
      done();
    });
  });

  it('should be able to retrieve an article', function(done) {
    request(app)
    .get(relativePath)
    .expect(200)
    .then(function(res) {
      if (!res.body['@id'])
        return done(Error("Should be able to get an article by ID"));
      done();
    });
  });

  it('should be able to update an article', function(done) {
    article.name = "Breaking News: Update";
    request(app)
    .put(relativePath)
    .set('x-api-key', global.user.apiKey)
    .send(article)
    .expect(200)
    .then(function(res) {
      if (res.body.name != "Breaking News: Update")
        return done(Error("Should be able to rename an article"));
      done();
    });
  });
  
  it('should be able to delete an article', function(done) {
    request(app)
    .delete(relativePath)
    .set('x-api-key', global.user.apiKey)
    .expect(204)
    .then(function(res) {
      done();
    });
  });

  it('should not be able to retrieve an article that has been deleted', function(done) {
    request(app)
    .get(relativePath)
    .set('x-api-key', global.user.apiKey)
    .expect(404)
    .then(function(res) {
      if (res.body['@id'])
        return done(Error("Should not be able to get an article by ID once it has been deleted"));
      done();
    });
  });
});
