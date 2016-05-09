/**
 * A base schema for properties common to all entities
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    serialize = require('../lib/serialize');

module.exports = new function() {
  
  // Define properties common to all Entities
  this.schema = new Schema({
    name: {
      type: String,
      trim: true,
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    disambiguationHint: {
      type: String,
      trim: true
    },
    sameAs: [String],
    primaryTopicOf: [String],
    createdOn: { type: Date, default: Date.now },
    updatedOn: { type: Date, default: Date.now }
  }, {
    collection       : 'entities',
    discriminatorKey : '_type'
  });

  // Define behaviour for serialising entities to JSON
  this.schema.methods.toJSON = function() {
    return serialize.toJSON(this.toObject());
  }

  // Define behaviour for serialising entities to JSON-LD
  this.toJSONLD = function() {
    return serialize.toJSONLD(this.toObject());
  };

  this.schema.pre('save', function(next) {
    if (!this.isNew)
      this.updatedOn = new Date();

    // Insert hook to push updates to other platforms (e.g. Triplestore) here…
    
    next();
  });

  this.schema.pre('remove', function(next) {
    // Insert hook to remove entires from other platforms (e.g. Triplestore)…
    next();
  });
  
  /**
   * Return a new entity of given type
   *
   * @param {string} type    - A valid type. e.g. 'Person', 'Place', 'Event'…
   * @param {Object} entity  - An entity object (optional)
   */
  this.new = function(type, entity) {
    
    // Load all the entity types we know about
    // Note: This happens inside the function as it can't be done until 
    // after this library has loaded as these libraries depend on this one!
    var Person = require('../models/entities/person'),
        Place = require('../models/entities/place'),
        Organization = require('../models/entities/organization'),
        Event = require('../models/entities/event'),
        Quote = require('../models/entities/quote');
        
    switch(type) {
      case 'Person':
        return (entity) ? new Person(entity) : Person;
        break;
      case 'Organization':
        return (entity) ? new Organization(entity) : Organization;
        break;
      case 'Place':
        return (entity) ? new Place(entity) : Place;
        break;
      case 'Event':
        return (entity) ? new Event(entity) : Event;
        break;
      case 'Quote':
        return (entity) ? new Quote(entity) : Quote;
        break;
      default:
        return null;
    }
  };
  
  return this;
};