var express = require('express'),
    partials = require('express-partials'),
    bodyParser = require('body-parser'),
    app = express(),
    ejs = require('ejs'),
    mongoose = require('mongoose'),
    path = require('path')
    jsonMarkup = require('json-markup');

// Handler for DB Connection Errors
mongoose.connection.on('error', function(err) {
  console.error("MongoDB error", err);
});

// Connect to the Mongo DB (mLab on Heroku uses MONGOLAB_URI)
mongoose.connect( process.env.MONGODB || process.env.MONGOLAB_URI || 'mongodb://localhost/structured-data' );

// Configure Express to handle JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// We have to set a template engine for Express
app.set('view engine', 'ejs');
app.engine('ejs', ejs.__express);
partials.register('.ejs', ejs);
app.use(partials());

// Serve static content from the public directory
app.use(express.static(path.join(__dirname, 'public')));

app.set('port', process.env.PORT || 3000);

/**
 * Parse and load schemas as databases models
 */
var schemaParser = require('./lib/schema-parser');
schemaParser.collectionName =  process.env.COLLECTION || 'entities';
schemaParser.schemaDir = process.env.SCHEMAS || __dirname+"/schemas/";

schemaParser
.load()
.then(function(schemas) {
  
  var listOfSchemas = [];
  for (var schemaName in schemas.schemas) listOfSchemas.push(schemaName);

  /**
   * Homepage
   */
  app.get('/', function(req, res, next) { 
    res.render('index', { schemas: listOfSchemas });
  });
  
  /**
   * Return webpage with list of all schemas
   */
  app.get('/schemas', function(req, res, next) {
    res.render('schemas', { schemas: listOfSchemas });
  });

  /**
   * Return webpage with information about a schema
   */
  app.get('/schema/:name', function(req, res, next) {
    if (schemas.schemas[req.params.name]) {
      if (req.headers.accept && req.headers.accept.indexOf('json') > -1) {
        res.status(200).json(schemas.schemas[req.params.name].schema);
      } else {
        res.render('schema', { schemaName: schemas.schemas[req.params.name].model.modelName, schema: jsonMarkup(schemas.schemas[req.params.name].schema) } );
      }
    } else {
      res.status(404).json({error: 400, message: "Schema not found", requestedUrl: req.originalUrl });
    }
  });
  
  
  /**
   * Routes for for the API
   */
  var apiRoutes = require('./routes/api');
  app.use('/api', apiRoutes(schemas));
  
  /**
   * 500 Error Handler
   */
  app.use(function (err, req, res, next) {
    // Handle 404s
    if (err.message
      && (~err.message.indexOf('not found')
      || (~err.message.indexOf('Cast to ObjectId failed')))) {
      return next();
    };
    console.error(err);
    if (err.stack) console.error(err.stack);
    res.status(500).json({error: 500, message: err.message });
  });

  /**
   * 404 File Not Found Handler
   */
  app.use(function(req, res, next) {
    res.status(404).json({error: 400, message: "File not found", requestedUrl: req.originalUrl });
  });
  
  // If running in test mode we don't actually need to start a listner that binds to a port
  if (process.env.NODE_ENV == "test")
    return;
  
  /**
   * Start listening
   * @TODO Check MongoDB is up
   */
  app.listen(app.get('port'), function() {
    console.log('Server listening on port %d in %s mode', app.get('port'), app.get('env'));
  });
  
})
.catch(function(err) {
  console.error("Unable to start server as failed to load schemas: ",err);
});

module.exports = app;