var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    schemas = require('../lib/schemas'),
    serialize = require('../lib/serialize');

schemas
.load()
.then(function(models) {
  /**
   * Create entity
   */
  router.post('/', function(req, res, next) {
    if (!req.body.type)
      return res.status(400).json({ error: "Entity type required." });

    var entityType = req.body.type;
  
    if (!models[entityType])
      return res.status(400).json({ error: "Invalid entity type specified." });
    
    var entity = new models[entityType](req.body)
    entity._type = entityType;
    entity.save(function(err, entity) {
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
      if (err) return res.status(400).json({ error: "Unable to fetch entity." });
      
      if (!entity)
        return res.status(404).json({ error: "Entity ID not valid" });

      // Use the appropriate model based on the entity type to load the entity
      entity = new models[entity._type](rentity)
      if (entity === null)
        return res.status(500).json({ error: "Unable to return entity - entity is of unknown type" });

      if (/application\/ld\+json/.test(req.get('accept'))) {
        return res.json(serialize.toJSONLD(entity.toObject()));
      } else {
        return res.json(entity);
      }
    });
    
  });

  /**
   * Update entity
   */
  router.put('/:id', function(req, res, next) {

  });

  /**
   * Create entity
   */
  router.delete('/:id', function(req, res, next) {

  });

  /**
   * Create entity
   */
  router.post('/search', function(req, res, next) {

  });


});


module.exports = router;