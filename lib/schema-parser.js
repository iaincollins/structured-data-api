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
  var _self = this;
  
  var collectionName = "entities";
  this.collectionName = collectionName;

  var schemaDir = __dirname+"/../schemas/";
  this.schemaDir = schemaDir;
  
  this.load = function() {
    var promise = new Promise(function(resolve, reject) {
      // If path is not absolute (ie begins with /) treat as relative
      var pathToSchemaDir = _self.schemaDir;
      if (!pathToSchemaDir.match(/\//))
        pathToSchemaDir = __dirname+"/../"+_self.schemaDir;

      try {
       if (!fs.lstatSync(pathToSchemaDir).isDirectory())
         return reject("Schema directory is not a directory: "+path.resolve(pathToSchemaDir));
       } catch (e) {
         return reject("Schema directory not found: "+path.resolve(pathToSchemaDir));
       }
       
      _loadSchemas(pathToSchemaDir, _self.collectionName)
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
           * schemas/Person.json                Model: 'Person'
           * schemas/Event.json                 Model: 'Event'
           * schemas/Articles/NewsArticle.json  Model: 'NewsArticle'
           */
          var modelName = pascalCase(path.basename(pathToFile, '.json'));
    
          /**
           * If a schema is in a sub-directory, the collectionName will be a 
           * pluralized form of the parent directory. It will attempt to
           * pluralize English words according to normal grammatical rules.
           * 
           * e.g. "book" -> "books", "person" -> "people", "sheep" -> "sheep"
           *
           * Any schemas at the root of the schema directory will use the
           * default collection name which is 'entities' (can be changed with
           * environment varaible DEFAULT_COLLECTION).
           *
           * If you want to be able to search across all your entries in the DB 
           * you will want them in the same collection. If you you want to be
           * strict about keeping different entities types in different
           * collections you can choose group them or not by laying out the
           * directory structure as you wish.
           * 
           * schemas/Person.json                            collectionName: 'entities'
           * schemas/Person/Person.json                     collectionName: 'people'
           * schemas/Person/Author.json                     collectionName: 'people'
           * schemas/CreativeWork/Article.json:             collectionName: 'creativeWorks'
           * schemas/CreativeWork/Report.json:              collectionName: 'creativeWorks'
           * schemas/CreativeWork/Article/NewsArticle.json: collectionName: 'articles'
           */
            var schemaCollectionName = collectionName;
            if (path.resolve(path.dirname(pathToFile)) != path.resolve(schemaDir)) {
              var schemaCollectionName = '';
              var dirs = path.relative(schemaDir, path.dirname(pathToFile)).split(/\//);
              schemaCollectionName = camelCase(pluralize.plural(dirs[dirs.length-1]));
            }

            _convertJsonSchemaToModel(path.resolve(pathToFile), modelName, schemaCollectionName)
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
      * 'refSafeSchema' contains a schema without any circular references.
      * If a schema contains circular references, the value of refSafeSchema
      * will be the schema without *any* of the references resolved (as
      * circular references can't be deseralized).
      *
      * The path to properties that map to objectst that circular references 
      * will be added to 'replacedReferences'
      */
      var refSafeSchema = require(pathToJsonSchema),
          refs = {},
          replacedReferences =  {};

      if (process.env.REPLACE_REF) {
        refSafeSchema = _replaceSchemaRefs(pathToJsonSchema, refSafeSchema, process.env.REPLACE_REF.toLowerCase(), replacedReferences);
      } else {
        try {
          // If the dereferencedJsonSchema can be seralized then it is not
          // circular and we use that in preference for the schema.
          var tmpSchema = JSON.stringify(dereferencedJsonSchema);
          refSafeSchema = dereferencedJsonSchema;
        } catch (e) {
          // If dereferencedJsonSchema can't be seralized then strip out the 
          // references and convert them in to something else
          // e.g. plain objects, Object IDs or URIs
          if (e == "TypeError: Converting circular structure to JSON") {
            console.log("@WARNING Schema '"+ pathToJsonSchema + "' contains circular references.");
            console.log("@WARNING All $ref values converted to be objects will not be validated.");
          } else {
            console.log("@WARNING Unexpected error parsing references in "+pathToJsonSchema);
          }
          var replaceWith = 'object';
          if (process.env.REPLACE_CIRCULAR_REF)
            replaceWith = process.env.REPLACE_CIRCULAR_REF.toLowerCase()
          refSafeSchema = _replaceSchemaRefs(pathToJsonSchema, refSafeSchema, replaceWith, replacedReferences);
        }
      }

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
      traverse(refSafeSchema).forEach(function(node) {
        // Add the regex pattern for an ObjectId when handling objects of type "objectid"
        if (typeof node == 'object'
            && node.type && node.type == 'string'
            && node.format && node.format == 'objectid') {
              node.pattern = "^[0-9a-fA-F]{24}$";
              this.update(node);
        }
      });
      
      var dereferencedJsonSchemaForMongoose = clone(refSafeSchema);
      traverse(dereferencedJsonSchemaForMongoose).forEach(function(node) {
        if (typeof node == 'object'
            && node.type && node.type == 'string'
            && node.format && node.format == 'objectid') {
              this.update({ $ref: "#/definitions/objectid" })
        }
      });

      var mongooseSchema = createMongooseSchema(refs, dereferencedJsonSchemaForMongoose);
            
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
        
        //@FIXME if replacedReferences.length > 0 validate their contents against their schema …recursively?
        
        _validate(this, refSafeSchema, next);
      });
    
      // Update hook
      schema.pre('update', function(next) {
        this._update._updated = new Date();
        
        // @TODO Support custom hooks
        // save_hook(this, next(), modelName, collectionName, pathToJsonSchema);

        //@FIXME if replacedReferences.length > 0 validate their contents against their schema …recursively?
        
        _validate(this._update, refSafeSchema, next);
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

      resolve({ model: mongoose.model(modelName, schema), schema: refSafeSchema, collectionName: collectionName, replacedReferences: replacedReferences });
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
  
  // Medatada fields are reserved names and not validated against the schema.
  serialize.removeMetadata(parsedObject);

  var validation = tv4.validateMultiple(parsedObject, pathToJsonSchema);
  if (!validation.valid) { 
    var errorsToIgnore = 0;
    console.log(validation.errors)
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

function _replaceSchemaRefs(pathToSchema, schema, replaceWith, replacedReferences) {
  if (!replaceWith)
    replaceWith = 'object';
  
  return traverse(schema).map(function(node) {
      if (node['$ref']) {
        if (replacedReferences)
          replacedReferences[this.path.join('.')] = node['$ref'];
        if (replaceWith == "objectid") {
          console.log(" \\_ "+path.basename(pathToSchema)+": Reference to "+node['$ref']+" at "+this.path.join('.')+" converted to Object ID.");
          this.update({ type: 'string', format: 'objectid', pattern: "^[0-9a-fA-F]{24}$", description: "The ObjectID of an object in the database matching the schema "+node['$ref'] });
        } else if (replaceWith == "uri") {
          console.log(" \\_ "+path.basename(pathToSchema)+": Reference to "+node['$ref']+" at "+this.path.join('.')+" converted to URI");
          this.update({ type: 'string', format: 'uri', description: "The URL of a resource matching the schema "+node['$ref'] });
        } else {
          console.log(" \\_ "+path.basename(pathToSchema)+": Reference to "+node['$ref']+" at "+this.path.join('.')+" converted to an object");
          this.update({ type: 'object', properties: {}, additionalProperties: true, description: "An object matching the schema "+node['$ref'] });
        }
      }
  });
}