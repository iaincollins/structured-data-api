var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    schemas = require('../lib/schemas'),
    serialize = require('../lib/serialize');

schemas
.load()
.then(function(models) {

  /**
   * Search entities
   */
  router.post('/search', function(req, res, next) {

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
      if (err) return res.status(500).json({ error: "Unable to create entity." });
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
    .collection('entities')
    .findOne({_id: mongoose.Types.ObjectId(req.params.id)}, function(err, entity) {
      if (err) return res.status(500).json({ error: "Unable to fetch entity." });
      
      if (!entity)
        return res.status(404).json({ error: "Entity ID not valid" });

      // Use the appropriate model based on the entity type to load the entity
      var model = new models[entity._type](entity)
      if (model === null)
        return res.status(500).json({ error: "Unable to return entity - entity is of unknown type" });

      if (/application\/ld\+json/.test(req.get('accept'))) {
        return res.json(serialize.toJSONLD(model.toObject()));
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
     .collection('entities')
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
       .update(entity, { overwrite: true, runValidators: false }, function(err) {
         if (err) return res.status(500).json({ error: "Unable to save changes to entity." });
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
    .collection('entities')
    .remove({_id: mongoose.Types.ObjectId(req.params.id)}, function(err, entity) {
      if (err) return res.status(500).json({ error: "Unable to delete entity." });

      if (!entity)
        return res.status(404).json({ error: "Entity has already been deleted" });
      return res.status(204).json();
    });
  });


});


module.exports = router;