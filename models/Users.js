var mongoose = require('mongoose');
var crypto = require('crypto');
var passwords = require('../config/passwords.js');

var UserSchema = new mongoose.Schema({
  givenName: String,
  preferredName: String,
  email: String,
  type: String,
  class: Number,
  address: String,
  phone: String,
  birthdate: Date,
  token: String,
  googleId: String,
  image: String
});

UserSchema.methods.generateToken = function(lifetime, cb){
  var token = crypto.randomBytes(48).toString('hex');
  var cipher = crypto.createCipher('aes-256-cbc', passwords.secretKey);
  //lifetime is in seconds
  var now = new Date();
  var exp = now.getTime() + ((lifetime-60) * 1000);
  var tokenContainer = {
    token: token,
    exp: exp
  }
  var payload = {
    payload: cipher.update(JSON.stringify(tokenContainer), 'utf8', 'base64') + cipher.final('base64'),
    exp: exp
  }
  this.token = token;
  this.save(cb);
  return payload;
}

UserSchema.static.decodeToken = function(payload, cb){
  var decipher = crypto.createDecipher('aes-256-cbc', passwords.secretKey);
  var tokenContainer = decipher.update(payload, 'base64', 'utf8') + decipher.final('utf8');
  tokenContainer = JSON.parse(tokenContainer);
  console.log(tokenContainer.token);
}


mongoose.model('User', UserSchema)
