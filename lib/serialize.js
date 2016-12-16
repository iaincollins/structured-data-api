/** 
 * Methods to handle seralisation of objects from models to JSON and JSON-LD
 * This has been written for clarity rather than performance.
 */
module.exports = new function() {

 /**
  * Add inline metadata and context info for JSON-LD objects.
  *
  * If the 'strict' argument is true then ONLY addds metadata fields designed to
  * pass strict validation (requesting JSON-LD explicitly should always return
  * objects that are valid against a strict validator).
  */
 function _addMetadata(obj, strict) {
   obj['@id'] = global.baseUri+"/"+obj._type+"/"+obj._id;
   obj["@context"] = process.env.CONTEXT_URI || "http://schema.org/";
   obj["@type"] = obj._type;
   if (strict !== true) {
     obj['@dateCreated'] = obj._created;
     obj['@dateModified'] = obj._updated;
   }
 }

 /**
  * Removes all keys begining with an @ (recursively)
  */
 function removeMetadata(obj) {
   for (var key in obj) {
     // Ignore functions. Only applies to Strings, Numbers & nested Objects
     if (typeof(obj[key])!="function") {
       if ((/^@(.*)/).test(key)) {
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
   * Removes all keys begining with an underscore when serializing (recursively)
   */
  function _removePrivateKeys(obj) {
    for (var key in obj) {
      // Ignore functions. Only applies to Strings, Numbers & nested Objects
      if (typeof(obj[key])!="function") {
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
    
  this.toJSON = function(obj) {
    _addMetadata(obj);
    _removePrivateKeys(obj);
    _removeEmptyKeys(obj);
    return obj;
  }
  
  /**
   * @TODO Still work in progress
   */
  this.toJSONLD = function(obj) {
    _addMetadata(obj, true);
    _removePrivateKeys(obj);
    _removeEmptyKeys(obj);
    return obj;
  }

  this._removePrivateKeys = _removePrivateKeys;
  this.removeMetadata = removeMetadata;
  return this;
};
