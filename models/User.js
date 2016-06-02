var mongoose = require('mongoose'),
    crypto = require('crypto'),
    serialize = require('../lib/serialize'),
    randomKey = require('random-key');

var schema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, unique: true, lowercase: true, required: true },
  role: { type: String, enum: ['ADMIN', 'USER', 'GUEST'], default: 'USER' },
  apiKey: { type: String, unique: true },
  created: { type: Date, default: Date.now }
});

schema.pre('save', function(next) {
  if (this.isNew && !this.apiKey)
    this.apiKey = randomKey.generateBase30(5)
                +"-"+randomKey.generateBase30(5)
                +"-"+randomKey.generateBase30(5)
                +"-"+randomKey.generateBase30(5)
                +"-"+randomKey.generateBase30(5)
                +"-"+randomKey.generateBase30(5);

  next();
});

schema.methods.toJSON = function() {
  return serialize.toJSON(this.toObject());
}

module.exports = mongoose.model('User', schema);