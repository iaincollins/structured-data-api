var fs = require('fs'),
    path = require('path'),
    glob = require("glob-promise")
    pluralize = require('pluralize'),
    camelCase = require('camelcase'),
    pascalCase = require('pascalcase'),
    mongoose = require('mongoose'),
    createMongooseSchema = require('json-schema-to-mongoose'),
    tv4 = require('tv4'),
    refParser = require('json-schema-ref-parser'),
    serialize = require('./serialize'),
    traverse = require('traverse'),
    clone = require('clone'),
    util = require('util');

/**
 * Export module once loaded
 */
module.exports = new function() {
  
  var collectionName = "entities";
  this.collectionName = collectionName;

  var schemaDir = __dirname+"/../schemas/";
  this.schemaDir = collectionName;

  
  this.load = function() {
    var promise = new Promise(function(resolve, reject) {
      _loadSchemas(schemaDir, collectionName)
      .then(function(schemas) {
        resolve(schemas);
      })
      .catch(function(err) {
        reject(err);
      });

    });
    return promise;
  }

  return this;
};

var schemas = null;

function _loadSchemas(schemaDir, collectionName) {
  var promises = [];
  
  var promise = new Promise(function(resolve, reject) {
      // Check if schemas is already populated
    if (schemas != null)
      return resolve(schemas);
    
    // If schemas is null then nitialise as an object
    schemas = { schemas: {}, collectionName: collectionName, schemaDir: schemaDir};

    // Get list of all files in schema and turn them into models
    glob(schemaDir+"/**/*.json", {})
    .then(function(files) {

      files.forEach(function(pathToFile) {
        var filePromise = new Promise(function(filePromiseResolve, filePromiseReject) {

          /**
           * The model name is based on filename of the schema.
           *
           * e.g.
           *
           * schemas/Person.json               - Model: 'Person'
           * schemas/Event.json                - Model: 'Event'
           * schemas/articles/NewsArticle.json - Model: 'NewsArticle'
           */
          var modelName = pascalCase(path.basename(pathToFile, '.json'));
    
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

            _convertJsonSchemaToModel(pathToFile, modelName, collectionName)
            .then(function(model) {
              filePromiseResolve(model);
            })
            .catch(function(err) {
              console.error("Error loading schema '"+modelName+"'!\n" , err);
              filePromiseReject(err);
            });
          });
          promises.push(filePromise);

        });
        
        return Promise.all(promises);
  
      })
      .then(function(parsedSchemas) {
        parsedSchemas.forEach(function(schema) {
          schemas.schemas[schema.model.modelName] = schema;
        });
        return resolve(schemas);
      })
      .catch(function(err) {
        console.error("Error loading schemas!\n" , err);
        reject(err);
      });
    
  });

  return promise;

}


// Turn a JSON Schema into a Mongoose Model
function _convertJsonSchemaToModel(pathToJsonSchema, modelName, collectionName) {
  var promise = new Promise(function(resolve, reject) {

    refParser.dereference(pathToJsonSchema)
    .then(function(dereferencedJsonSchema) {
  
      /**
       * We clone dereferencedJsonSchema into dereferencedJsonSchemaForMongoose.
       *
       * - dereferencedJsonSchema is used for schema validation
       * - dereferencedJsonSchemaForMongoose is used for the mongoose schema
       * 
       * We do this so that dereferencedJsonSchemaForMongoose to look for
       * objects that are { type: 'string', format: 'objectid' } and change
       * them to use a special reference which 'json-schema-to-mongoose' 
       * knowns to change them to be an object id.
       */
      traverse(dereferencedJsonSchema).forEach(function(node) {
        // Add the regex pattern for an ObjectId when handling objects of type "objectid"
        if (typeof node == 'object'
            && node.type && node.type == 'string'
            && node.format && node.format == 'objectid') {
              node.pattern = "^[0-9a-fA-F]{24}$";
              this.update(node);
        }
      });
      var dereferencedJsonSchemaForMongoose = clone(dereferencedJsonSchema);
      traverse(dereferencedJsonSchemaForMongoose).forEach(function(node) {
        if (typeof node == 'object'
            && node.type && node.type == 'string'
            && node.format && node.format == 'objectid') {
              this.update({ $ref: "#/definitions/objectid" })
        }
      });
      
      var mongooseSchema = createMongooseSchema({}, dereferencedJsonSchemaForMongoose);
      
      // Add _type field to all models (used to store model name/type)
      mongooseSchema._type = { type: String };
    
      // Add _created and _updated timestamp fields to all objects
      mongooseSchema._created = { type: Date, default: Date.now };
      mongooseSchema._updated = { type: Date, default: Date.now };
      
      // Create new Mongoose object
      var schema = new mongoose.Schema(mongooseSchema, { collection: collectionName } )
      
      // Save hook
      schema.pre('save', function(next) {
        if (!this.isNew)
          this._updated = new Date();

        // @TODO Support custom hooks
        // save_hook(this, next(), modelName, collectionName, pathToJsonSchema);
        _validate(this, dereferencedJsonSchema, next);
      });
    
      // Update hook
      schema.pre('update', function(next) {
        this._update._updated = new Date();
        
        // @TODO Support custom hooks
        // save_hook(this, next(), modelName, collectionName, pathToJsonSchema);
        
        _validate(this._update, dereferencedJsonSchema, next);
      });
      
      // Delete hook
      schema.pre('remove', function(next) {
        // @TODO Support custom hooks
        // remove_hook(this, next(), modelName, collectionName, pathToJsonSchema);
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

      resolve({ model: mongoose.model(modelName, schema), schema: dereferencedJsonSchema });
    })
    .catch(function(err) {
      reject(err);
    });
   
  });
  return promise;
}

function _validate(objectToValidate, pathToJsonSchema, next) {
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
  
  var validation = tv4.validateMultiple(parsedObject, pathToJsonSchema);
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