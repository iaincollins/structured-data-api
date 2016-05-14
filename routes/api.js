var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    User = require('../models/User');

module.exports = function(schemas) {

  var listOfSchemas = [];
  for (var schemaName in schemas.schemas) listOfSchemas.push(schemaName);
  
  /**
   * Return list of all schemas
   */
  router.get('/schemas', checkHasReadAccess, function(req, res, next) {
    return res.status(200).json({ schemas: listOfSchemas });
  });

  /**
   * Return schema
   */
  router.get('/schema/:name', checkHasReadAccess, function(req, res, next) {
    if (schemas.schemas[req.params.name]) {
      res.status(200).json(schemas.schemas[req.params.name].schema);
    } else {
      res.status(404).json({error: 400, message: "Schema not found", requestedUrl: req.originalUrl });
    }
  });

  /**
   * Search entities
   */
  router.get('/search', checkHasReadAccess, function(req, res, next) {
    var query = {};

    if (req.query.type)
      query._type = req.query.type;

    if (req.query.name)
      query.name = req.query.name;

    if (req.query.sameAs)
      query.sameAs = req.query.sameAs;

    mongoose.connection.db
    .collection(schemas.collectionName)
    .find(query)
    .toArray(function(err, results) {
      if (err) return res.status(500).json({ error: "Unable to search entities" });
  
      // For each result, format it using the appropriate Entity model
      var entities = [];
      results.forEach(function(entity) {
        // Skip schemas that use a schema that isn't defined
        if (!schemas.schemas[entity._type])
          return;

        var model = new schemas.schemas[entity._type].model(entity);
    
        if (/application\/ld\+json/.test(req.get('accept'))) {
          entities.push(model.toJSONLD());
        } else {
          entities.push(model);
        }
      });
  
      return res.status(200).json(entities);
    });    
  });

  /**
   * Create entity
   */
  router.post('/', checkHasWriteAccess, function(req, res, next) {
    if (!req.body.type)
      return res.status(400).json({ error: "Entity type required" });

    var entityType = req.body.type;

    if (!schemas.schemas[entityType])
      return res.status(400).json({ error: "Invalid entity type specified" });

    var model = new schemas.schemas[entityType].model(req.body)
    model._type = entityType;
    model.save(function(err, entity) {
      if (err)
        return res.status(500).json({ error: "Unable to create entity", message: err.message || null });
      return res.status(201).json(entity);
    });
  });

  /**
   * Get entity
   */
  router.get('/:id', checkHasReadAccess, function(req, res, next) {
    if (req.params.id === null)
      return res.status(400).json({ error: "Entity ID required" });

    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: "Entity ID format invalid" });

    mongoose.connection.db
    .collection(schemas.collectionName)
    .findOne({_id: mongoose.Types.ObjectId(req.params.id)}, function(err, entity) {
      if (err) return res.status(500).json({ error: "Unable to fetch entity" });
  
      if (!entity)
        return res.status(404).json({ error: "Entity ID not valid" });

      if (!schemas.schemas[entity._type])
        return res.status(500).json({ error: "Unable to return entity - entity is of unknown type" });

      // Use the appropriate model based on the entity type to load the entity
      var model = new schemas.schemas[entity._type].model(entity);
      if (/application\/ld\+json/.test(req.get('accept'))) {
        return res.json(model.toJSONLD());
      } else {
        return res.json(model);
      }
    });

  });

  /**
   * Update entity
   */
  router.put('/:id', checkHasWriteAccess, function(req, res, next) {
    if (req.params.id === null)
       return res.status(400).json({ error: "Entity ID required" });

     if (!mongoose.Types.ObjectId.isValid(req.params.id))
       return res.status(400).json({ error: "Entity ID format invalid" });

     mongoose.connection.db
     .collection(schemas.collectionName)
     .findOne({_id: mongoose.Types.ObjectId(req.params.id)}, function(err, entityInDatabase) {
       if (err) return res.status(500).json("Unable to fetch entity");

       if (!entityInDatabase)
         return res.status(404).json({ error: "Entity ID not valid" });

       var entity = req.body;

       // These properties are immutable (as far as the API is concerned)
       entity._id = entityInDatabase._id;
       entity.__v = entityInDatabase.__v;
       entity._type = entityInDatabase._type;
       entity._created = entityInDatabase._created;
       entity._updated = entityInDatabase._updated;

       // Save changes to entity by first getting back a blank entity and then
       // passing update() to it. This is slightly cumberson but Mongoose 4.x
       // seems to have broken how hydrate/init works and saves siliently fail
       // if you just hydrate/init and .save()
       //
       // @FIXME: runValidators: true DOES NOT WORK. so values like 'required'
       // are ignored (and fields that should be required can be removed).
       //options:        
       var model = new schemas.schemas[entityInDatabase._type].model(entity);
       model
       .update(entity, { overwrite: true, runValidators: true }, function(err) {
         if (err)
           return res.status(500).json({ error: "Unable to save changes to entity", message: err.message || null });
         
         return res.json(entity);
      });
    });

  });

  /**
   * Delete entity
   */
  router.delete('/:id', checkHasWriteAccess, function(req, res, next) {
    if (req.params.id === null)
      return res.status(400).json({ error: "Entity ID required" });

    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: "Entity ID format invalid" });

    mongoose.connection.db
    .collection(schemas.collectionName)
    .remove({_id: mongoose.Types.ObjectId(req.params.id)}, function(err, entity) {
      if (err) return res.status(500).json({ error: "Unable to delete entity" });

      if (!entity)
        return res.status(404).json({ error: "Entity has already been deleted" });
      
      return res.status(204).json();
    });
  });

  /**
   * By default everyone has read access (without an API Key).
   */
  function checkHasReadAccess(req, res, next) {
    return next();
  };

  /**
   * By default only admin users have write access
   */
  function checkHasWriteAccess(req, res, next) {
    var apiKey = req.headers['x-api-key'] || null;
    User
    .findOne({ apiKey: apiKey })
    .exec(function(err, user) {
      if (err)
        return res.status(500).json({ error: "Unable to authenticate API Key", message: err.message || null });

      if (!user)
        return res.status(403).json({ error: "Access denied - API Key invalid" });

      if (user.role != 'ADMIN')
        return res.status(403).json({ error: "Access denied - Account does not have write access" });
      
      return next();
    });
  };
  
  return router;
};