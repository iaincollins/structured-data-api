var fs = require('fs'),
    path = require('path'),
    glob = require("glob")
    pluralize = require('pluralize'),
    camelCase = require('camelcase'),
    pascalCase = require('pascalcase'),
    mongoose = require('mongoose'),
    createMongooseSchema = require('json-schema-to-mongoose'),
    jsonSchemaValidator = require('mongoose-jsonschema-validation'),
    traverse = require('traverse');
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
      }, function(err) {
        console.error("Error loading schema" , err);
        reject(err);
      });

    });
    return promise;
  }

  return this;
};

var schemaDir = process.env.SCHEMAS || __dirname + '/../schemas';
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
         * ../schemas/Person.js               - Model: 'Person'
         * ../schemas/Event.js                - Model: 'Event'
         * ../schemas/articles/NewsArticle.js - Model: 'NewsArticle'
         */
        var jsonSchema = JSON.parse(fs.readFileSync(file, 'utf8'));
        var modelName = pascalCase(path.basename(file, '.json'));
        var collectionName = 'entities';
        
        /**
         * @TODO Use directory strucutre to set collection name.
         *       In order to do that we will need to return models by collection name,
         *       and create dynamic routes for each type of collection. Will require
         *       some refactoring of how routes work.
         * 
         * If the model is in a sub directory, the collectionName should be a 
         * pluralized form of the parent directory path.
         *
         * ../schemas/CreativeWork/Article.js:             collectionName = 'creativeWorks'
         * ../schemas/CreativeWork/Report.js:              collectionName = 'creativeWorks'
         * ../schemas/CreativeWork/Article/NewsArticle.js: collectionName = 'creativeWorkArticles'
         * ../schemas/CreativeWork/Report/Report.js:       collectionName = 'creativeWorkReports'
         */
         // collectionName = camelCase(pluralize.plural( path.dirname(path.relative(__dirname, file)).replace(/^\.\.\/schemas(\/?)/, '').replace(/\//g, '-') || modelName ));

        _convertJsonSchemaToModel(jsonSchema, modelName, collectionName)
        .then(function(mongooseModel) {
          _models[modelName] = mongooseModel;
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
    var refs = {};
    if (jsonSchema.definitions)
      refs = jsonSchema.definitions;

    traverse(jsonSchema).forEach(function(node) {
        if (this.key == '$ref')
          this.update(node.replace(/^\#\/definitions\//, ''));
    });
    
    var mongooseSchema = createMongooseSchema(refs, jsonSchema);

    // Add _type field to all models (used to store model name/type)
    mongooseSchema._type = { type: String };
    
    // Add _created and _updated timestamp fields to all objects
    mongooseSchema._created = { type: Date, default: Date.now };
    mongooseSchema._updated = { type: Date, default: Date.now };
    
    /**
     * @TODO Add support for JSON Schema types beyond currently supported primitives/
     *      eg https://github.com/natesilva/jayschema
     * "date-time": Date representation, as defined by RFC 3339, section 5.6.
     * "email": Internet email address, see RFC 5322, section 3.4.1.
     * "hostname": Internet host name, see RFC 1034, section 3.1.
     * "ipv4": IPv4 address, according to dotted-quad ABNF syntax as defined in RFC 2673, section 3.2.
     * "ipv6": IPv6 address, as defined in RFC 2373, section 2.2.
     * "uri": A universal resource identifier (URI), according to RFC3986.
     */
    
    // Create new Mongoose object
    var schema = new mongoose.Schema(mongooseSchema, { collection: collectionName } )
    
    // Save hook
    schema.pre('save', function(next) {
      if (!this.isNew)
        this._updated = new Date();
      // @TODO Support custom hooks
      // save_hook(this, next(), modelName, collectionName, jsonSchema);
      next();
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
    
    // Add JSON Schema validation to Mongoose object
    // @FIXME Bug with the validator enabled that is preventing models from instantiating
    /*
    schema.plugin(jsonSchemaValidator, {
      jsonschema:  jsonSchema
    });
    */
    resolve(mongoose.model(modelName, schema));
  });
  return promise;
}