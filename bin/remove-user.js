#! /usr/bin/env node
var mongoose = require('mongoose'),
    User = require('../models/User'),
    commandLineArgs = require('command-line-args');

var cli = commandLineArgs([
  { name: 'help', alias: 'h', type: Boolean, description: "Display this message" },
  { name: 'verbose', alias: 'v', type: Boolean, description: "Verbose error messages" },
  { name: 'email', alias: 'e', type: String, description: "The email address of the user you want to remove" },
  { name: 'id', alias: 'i', type: String, description: "The ID of the user you want to remove" },
  { name: 'api-key', alias: 'k', type: String, description: "The API key of the user you want to remove" }
])

var options = cli.parse();

var params = {};
if (options.id) params._id = options.id;
if (options.email) params.email = options.email;
if (options['api-key']) params.apiKey = options['api-key'];

if (Object.keys(params).length === 0 || options.help)
  return console.log(cli.getUsage());

mongoose.connect( process.env.MONGODB || process.env.MONGOLAB_URI || 'mongodb://localhost/structured-data' );

User.findOneAndRemove(params, function(err, user) {
  mongoose.disconnect();
  if (err) {
    console.error("Failed to create account.");
    if (options.verbose) {
      console.error(err);
    } else {
      console.error("Use --verbose for more details.");
    }
    return;
  }
  if (!user)
    return console.error("User not found.");
  console.log("User deleted.");
});