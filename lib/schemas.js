var fs = require('fs'),
    path = require('path'),
    glob = require("glob")
    pluralize = require('pluralize'),
    camelCase = require('camelcase'),
    pascalCase = require('pascalcase'),
    mongoose = require('mongoose'),
    createMongooseSchema = require('json-schema-to-mongoose'),
    tv4 = require('tv4'),
    refParser = require('json-schema-ref-parser'),
    serialize = require('./serialize');

/**
 * Export module once loaded
 */
module.exports = new function() {

  this.load = function() {
    var promise = new Promise(function(resolve, reject) {
      _loadSchemas()
      .then(function(models) {
        resolve(models);
      })
      .catch(function(err) {
        reject(err);
      });

    });
    return promise;
  }

  return this;
};

var schemaDir = process.env.SCHEMAS;
var _models = null;

function _loadSchemas() {
  var promise = new Promise(function(resolve, reject) {
    // Check if _models is already populated
   if (_models != null)
     return resolve(_models);
    
    // If _models is null then nitialise as an object
    _models = {};
    
    // Get list of all files in schema and turn them into models
    glob(schemaDir+"/**/*.json", {}, function (er, files) {
      files.forEach(function(file) {
        /**
         * The model name is based on filename of the schema.
         *
         * e.g.
         *
         * schemas/Person.json               - Model: 'Person'
         * schemas/Event.json                - Model: 'Event'
         * schemas/articles/NewsArticle.json - Model: 'NewsArticle'
         */
        var jsonSchema = JSON.parse(fs.readFileSync(file, 'utf8'));
        var modelName = pascalCase(path.basename(file, '.json'));
        var collectionName = 'entities';
        
        /**
         * @TODO Use directory structure to set collection name.
         *       In order to do that we will need to return models by collection name,
         *       and create dynamic routes for each type of collection. Will require
         *       some refactoring of how routes work.
         * 
         * If the model is in a sub directory, the collectionName should be a 
         * pluralized form of the parent directory path.
         *
         * schemas/CreativeWork/Article.json:             collectionName = 'creativeWorks'
         * schemas/CreativeWork/Report.json:              collectionName = 'creativeWorks'
         * schemas/CreativeWork/Report/Report.json:       collectionName = 'creativeWorkReports'
         * schemas/CreativeWork/Article/NewsArticle.json: collectionName = 'creativeWorkArticles'
         */
         // collectionName = camelCase(pluralize.plural( path.dirname(path.relative(__dirname, file)).replace(/^\.\.\/schemas(\/?)/, '').replace(/\//g, '-') || modelName ));

        _convertJsonSchemaToModel(jsonSchema, modelName, collectionName)
        .then(function(mongooseModel) {
          _models[modelName] = mongooseModel;
        })
        .catch(function(err) {
          console.error("Error loading schema\n" , err);
          reject(err);
        });
      });
      resolve(_models);
    });
  });
  return promise;
}


// Turn a JSON Schema into a Mongoose Model
function _convertJsonSchemaToModel(jsonSchema, modelName, collectionName) {
  var promise = new Promise(function(resolve, reject) {
    refParser.dereference(jsonSchema)
    .then(function(dereferencedJsonSchema) {
  
      var mongooseSchema = createMongooseSchema({}, dereferencedJsonSchema);
      
      // Add _type field to all models (used to store model name/type)
      mongooseSchema._type = { type: String };
    
      // Add _created and _updated timestamp fields to all objects
      mongooseSchema._created = { type: Date, default: Date.now };
      mongooseSchema._updated = { type: Date, default: Date.now };
    
      // Create new Mongoose object
      var schema = new mongoose.Schema(mongooseSchema, { collection: collectionName } )

      //var util = require('util');
      //console.log(util.inspect(mongooseSchema, false, null)+"----");
      
      // Save hook
      schema.pre('save', function(next) {
        if (!this.isNew)
          this._updated = new Date();

        // @TODO Support custom hooks
        // save_hook(this, next(), modelName, collectionName, jsonSchema);
        _validate(this, dereferencedJsonSchema, next);
      });
    
      // Update hook
      schema.pre('update', function(next) {
        this._update._updated = new Date();
        
        // @TODO Support custom hooks
        // save_hook(this, next(), modelName, collectionName, jsonSchema);
        _validate(this._update, dereferencedJsonSchema, next);
      });
      
      // Delete hook
      schema.pre('remove', function(next) {
        // @TODO Support custom hooks
        // remove_hook(this, next(), modelName, collectionName, jsonSchema);
        next();
      });
    
      // Define behaviour for serialising entities to JSON
      schema.methods.toJSON = function() {
        return serialize.toJSON(this.toObject());
      }
    
      // Define behaviour for serialising entities to JSON-LD
      schema.methods.toJSONLD = function() {
        return serialize.toJSONLD(this.toObject());
      };

      resolve(mongoose.model(modelName, schema));
    })
    .catch(function(err) {
      reject(err);
    });
   
  });
  return promise;
}

function _validate(objectToValidate, jsonSchema, next) {
  // Convert to plain JS object, then to string then back to object so that
  // fields of types like 'date-time' are compared as strings (not Date objects)
  // as validator doesn't know know how to check them as Date objects.
  //
  // In the case of dates the mongoose schema will take care of ensuring they 
  // are *also* valid date values, for other types there is currently no validation
  // (ie hostname, ipv4, ipv6 and uri are only validated as being strings).
  var parsedObject = JSON.parse(JSON.stringify(objectToValidate));

  // Remove private/internal only fields when validating (e.g. _created, _updated)
  serialize._removePrivateKeys(parsedObject);
  
  // The 'id' and 'type' fields are reserved names and not validated
  // against the schema - unlike the other reserved fields they are public
  // (not private) but not part of the schema so we need to remove them
  // when we check if the object is otherwise valid.
  delete parsedObject.id;
  delete parsedObject.type;
  
  var validation = tv4.validateMultiple(parsedObject, jsonSchema);
  if (!validation.valid) { 
    var errorsToIgnore = 0;
    validation.errors.forEach(function(error) {
      // Ignore errors that are "ONE_OF_MULTIPLE",
      // it's okay if an object matches multiple valid referenced schemas.
      if (error.code == 12)
        errorsToIgnore++;
    });
    if (validation.errors.length > errorsToIgnore)
      return next(new Error(validation.errors));
  }
  next();
}