#! /usr/bin/env node
var mongoose = require('mongoose'),
    User = require('../models/User'),
    commandLineArgs = require('command-line-args');

var cli = commandLineArgs([
  { name: 'help', alias: 'h', type: Boolean, description: "Display this message" },
  { name: 'verbose', alias: 'v', type: Boolean, description: "Verbose error messages" },
  { name: 'email', alias: 'e', type: String, description: "The users email address (required)" },
  { name: 'name', alias: 'n', type: String, description: "The users name (optional)" },
  { name: 'api-key', alias: 'k', type: String, description: "A pre-generated API key to assign (optional)" },
])

var options = cli.parse();

if (Object.keys(options).length === 0 || options.help)
  return console.log(cli.getUsage());

if (!options.email)
  return console.error("Email address required.");

mongoose.connect( process.env.MONGODB || process.env.MONGOLAB_URI || 'mongodb://localhost/structured-data' );

var user = new User();
user.role = "ADMIN";
user.email = options.email;
if (options.name) user.name = options.name;
if (options.organization) user.organization = options.organization;
if (options.location) user.location = options.location;
if (options['api-key']) user.apiKey = options['api-key'];
user.save(function(err) {
  mongoose.disconnect();
  
  if (err) {
    console.error("Failed to add user.");
    if (err.code == "11000")
      console.error("Check an account with the same email address or API key does not already exist.");
    if (options.verbose) {
      console.error(err);
    } else {
      console.error("Use --verbose for more details.");
    }
    return;
  }
    
  console.log("API Key: "+user.apiKey
            +"\tEmail: "+user.email
            +(user.name ? " ("+user.name+")" : "")
            );
});
