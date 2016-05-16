#! /usr/bin/env node
var mongoose = require('mongoose'),
    User = require('../models/User');
  
mongoose.connect( process.env.MONGODB || process.env.MONGOLAB_URI || 'mongodb://localhost/structured-data' );
  
User.find({}, function(err, users) {
  if (err) {
    mongoose.disconnect();
    console.error("Unable to list users.");
    return;
  }
  
  var i = 0;
  users.forEach(function(user) {
    console.log("API Key: "+user.apiKey
                +"\tEmail: "+user.email
                +(user.name ? " ("+user.name+")" : "")
                );
  });

  mongoose.disconnect();
});