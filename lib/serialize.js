/** 
 * Methods to handle seralisation of objects from models to JSON and JSON-LD
 * This has been written for clarity rather than performance.
 */
module.exports = new function() {
  /**
   * Removes all keys begining with an underscore when serializing (recursively)
   * Renames the '_id' field to 'id' and the '_type' field to 'type'.
   */
  function _removePrivateKeys(obj) {
    for (var key in obj) {
      // Ignore functions. Only applies to Strings, Numbers & nested Objects
      if (typeof(obj[key])!="function") {
         // Rename '_id' key to 'id' (unless 'id' field exists)
        if (key == '_id')
           obj.id = obj[key];
         // Rename '_type' key to 'type'
        if (key == '_type')
           obj.type = obj[key];
        if ((/^_(.*)/).test(key)) {
          // Delete keys begining with an underscope
          delete obj[key];
        } else if (obj[key] !== null && typeof(obj[key])=="object") {
          // If the property is an object then loop over it
          _removePrivateKeys(obj[key]);
        }
      }
    }
  }
  
  /**
   * Removes keys with empty values from the object passed to it
   */
  function _removeEmptyKeys(obj) {
    for (var key in obj) {
      if (Array.isArray(obj[key]) && obj[key].length == 0) {
        delete obj[key];
      } else if (obj[key] !== null && typeof(obj[key])=="object") {
        // If the property is an object then loop over it
        _removeEmptyKeys(obj[key]);
      }
    }
  }
  
  /**
   * Convert id keys to JSON-LD @id format (converting the value to a URI)
   * e.g. {id: AB34…} to {@id: http://localhost/AB34…}
   */
  function _convertIDsToURIs(obj) {
    for (var key in obj) {
      if (typeof(obj[key])!="function") {
        if (key == 'id') {
          obj['@id'] = 'http://localhost/entity/'+obj.id;
          delete obj[key];
        } else if (obj[key] !== null && typeof(obj[key])=="object") {
          // If the property is an object then loop over it
          _convertIDsToURIs(obj[key]);
        }
      }
    }
  }
  
  /**
   * Add inline context data for objects for JSON-LD.
   * For more details see https://www.w3.org/TR/json-ld/
   */
  function _addContext(obj) {
    return obj;
  }
    
  this.toJSON = function(obj) {
    _removePrivateKeys(obj);
    _removeEmptyKeys(obj);
    return obj;
  }
  
  /**
   * @TODO Still work in progress
   */
  this.toJSONLD = function(obj) {
    _removePrivateKeys(obj);
    _removeEmptyKeys(obj);
    _convertIDsToURIs(obj);
    _addContext(obj);
    return obj;
  }

  this._removePrivateKeys = _removePrivateKeys;
  return this;
};
