var express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    ejs = require('ejs'),
    mongoose = require('mongoose'),
    path = require('path');

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

// Serve static content from the public directory
app.use(express.static(path.join(__dirname, 'public')));

/**
 * @TODO Define homepage
 */
app.get('/', function(req, res, next) { res.json() });

/**
 * Routes for Entities
 */
app.use('/entity', require('./routes/entity'));

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

/**
 * Start listening
 * @FIXME Don't start listening until mongo is up
 */
app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;