var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    schemas = require('../lib/schemas');

schemas
.load()
.then(function(models) {

  var collectionName = schemas.collectionName;
  
  /**
   * Search entities
   */
  router.get('/search', function(req, res, next) {
    
    var query = {};

    if (req.query.type)
      query._type = req.query.type;

    if (req.query.name)
      query.name = req.query.name;

    if (req.query.sameAs)
      query.sameAs = req.query.sameAs;

    mongoose.connection.db
    .collection(collectionName)
    .find(query)
    .toArray(function(err, results) {
      if (err) return res.status(500).json({ error: "Unable to search entities." });
      
      // For each result, format it using the appropriate Entity model
      var entities = [];
      results.forEach(function(entity) {
        // Skip models that use a schema that isn't defined
        if (!models[entity._type])
          return;

        var model = new models[entity._type](entity);
        
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
  router.post('/', function(req, res, next) {
    if (!req.body.type)
      return res.status(400).json({ error: "Entity type required." });

    var entityType = req.body.type;
  
    if (!models[entityType])
      return res.status(400).json({ error: "Invalid entity type specified." });
    
    var model = new models[entityType](req.body)
    model._type = entityType;
    model.save(function(err, entity) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Unable to create entity." });
      }
      return res.status(201).json(entity);
    });
  });

  /**
   * Get entity
   */
  router.get('/:id', function(req, res, next) {
    if (req.params.id === null)
      return res.status(400).json({ error: "Entity ID required" });

    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: "Entity ID format invalid" });
    
    mongoose.connection.db
    .collection(collectionName)
    .findOne({_id: mongoose.Types.ObjectId(req.params.id)}, function(err, entity) {
      if (err) return res.status(500).json({ error: "Unable to fetch entity." });
      
      if (!entity)
        return res.status(404).json({ error: "Entity ID not valid" });

      if (!models[entity._type])
        return res.status(500).json({ error: "Unable to return entity - entity is of unknown type" });

      // Use the appropriate model based on the entity type to load the entity
      var model = new models[entity._type](entity);
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
  router.put('/:id', function(req, res, next) {
    if (req.params.id === null)
       return res.status(400).json({ error: "Entity ID required" });
  
     if (!mongoose.Types.ObjectId.isValid(req.params.id))
       return res.status(400).json({ error: "Entity ID format invalid" });
  
     mongoose.connection.db
     .collection(collectionName)
     .findOne({_id: mongoose.Types.ObjectId(req.params.id)}, function(err, entityInDatabase) {
       if (err) return res.status(500).json("Unable to fetch entity.");
    
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
       var model = new models[entityInDatabase._type](entity);
       model
       .update(entity, { overwrite: true, runValidators: true }, function(err) {
         if (err) {
           console.error(err);
           return res.status(500).json({ error: "Unable to save changes to entity." });
         }
         return res.json(entity);
      });
    });

  });

  /**
   * Delete entity
   */
  router.delete('/:id', function(req, res, next) {
    if (req.params.id === null)
      return res.status(400).json({ error: "Entity ID required" });

    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: "Entity ID format invalid" });

    mongoose.connection.db
    .collection(collectionName)
    .remove({_id: mongoose.Types.ObjectId(req.params.id)}, function(err, entity) {
      if (err) return res.status(500).json({ error: "Unable to delete entity." });

      if (!entity)
        return res.status(404).json({ error: "Entity has already been deleted" });
      return res.status(204).json();
    });
  });


});


module.exports = router;